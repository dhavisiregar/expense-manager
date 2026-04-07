package handler

import (
	"crypto/sha512"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	appmiddleware "github.com/dhavisiregar/expense-manager/internal/middleware"
	"github.com/dhavisiregar/expense-manager/internal/repository"
	"github.com/dhavisiregar/expense-manager/pkg/response"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

// PRO plan pricing (IDR)
const ProPriceIDR = 29000  // Rp 29.000/month
const ProDurationDays = 30

type SubscriptionHandler struct {
	repo repository.SubscriptionRepository
}

func NewSubscriptionHandler(repo repository.SubscriptionRepository) *SubscriptionHandler {
	return &SubscriptionHandler{repo: repo}
}

func (h *SubscriptionHandler) Routes() func(r chi.Router) {
	return func(r chi.Router) {
		r.Get("/status", h.Status)
		r.Post("/create-payment", h.CreatePayment)
		r.Post("/webhook", h.Webhook) // No auth — called by Midtrans
	}
}

// GET /api/v1/subscription/status
func (h *SubscriptionHandler) Status(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmiddleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	sub, _ := h.repo.GetByUserID(r.Context(), userID)
	response.JSON(w, http.StatusOK, sub)
}

// POST /api/v1/subscription/create-payment
// Creates a Midtrans Snap transaction and returns the snap_token + redirect_url
func (h *SubscriptionHandler) CreatePayment(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmiddleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var body struct {
		Email string `json:"email"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	serverKey := os.Getenv("MIDTRANS_SERVER_KEY")
	if serverKey == "" {
		response.Error(w, http.StatusInternalServerError, "payment not configured")
		return
	}

	orderID := fmt.Sprintf("PRO-%s-%d", userID.String()[:8], time.Now().Unix())

	// Save pending order
	orderIDStr := orderID
	sub, _ := h.repo.GetByUserID(r.Context(), userID)
	sub.MidtransOrderID = &orderIDStr
	h.repo.Upsert(r.Context(), sub)

	// Build Midtrans Snap request
	snapURL := "https://app.sandbox.midtrans.com/snap/v1/transactions"
	if os.Getenv("MIDTRANS_ENV") == "production" {
		snapURL = "https://app.midtrans.com/snap/v1/transactions"
	}

	payload := map[string]any{
		"transaction_details": map[string]any{
			"order_id":     orderID,
			"gross_amount": ProPriceIDR,
		},
		"item_details": []map[string]any{
			{
				"id":       "PRO_MONTHLY",
				"price":    ProPriceIDR,
				"quantity": 1,
				"name":     "DuitFlow Pro - 1 Month",
			},
		},
		"customer_details": map[string]any{
			"email": body.Email,
		},
		"callbacks": map[string]any{
			"finish":  os.Getenv("FRONTEND_URL") + "/upgrade?status=success",
			"error":   os.Getenv("FRONTEND_URL") + "/upgrade?status=error",
			"pending": os.Getenv("FRONTEND_URL") + "/upgrade?status=pending",
		},
	}

	payloadBytes, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", snapURL, strings.NewReader(string(payloadBytes)))
	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth(serverKey, "")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, "failed to create payment")
		return
	}
	defer resp.Body.Close()

	var snapResp map[string]any
	respBody, _ := io.ReadAll(resp.Body)
	json.Unmarshal(respBody, &snapResp)

	if resp.StatusCode != http.StatusCreated {
		response.Error(w, http.StatusBadRequest, fmt.Sprintf("midtrans error: %v", snapResp))
		return
	}

	response.JSON(w, http.StatusOK, map[string]any{
		"snap_token":   snapResp["token"],
		"redirect_url": snapResp["redirect_url"],
		"order_id":     orderID,
	})
}

// POST /api/v1/subscription/webhook
// Midtrans sends payment notifications here
func (h *SubscriptionHandler) Webhook(w http.ResponseWriter, r *http.Request) {
	var notif struct {
		OrderID           string `json:"order_id"`
		TransactionID     string `json:"transaction_id"`
		TransactionStatus string `json:"transaction_status"`
		FraudStatus       string `json:"fraud_status"`
		GrossAmount       string `json:"gross_amount"`
		SignatureKey      string `json:"signature_key"`
		StatusCode        string `json:"status_code"`
	}

	if err := json.NewDecoder(r.Body).Decode(&notif); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Verify signature: SHA512(order_id + status_code + gross_amount + server_key)
	serverKey := os.Getenv("MIDTRANS_SERVER_KEY")
	raw := notif.OrderID + notif.StatusCode + notif.GrossAmount + serverKey
	hash := fmt.Sprintf("%x", sha512.Sum512([]byte(raw)))
	if hash != notif.SignatureKey {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	// Only activate on settlement or capture (not pending/deny/expire)
	isSuccess := notif.TransactionStatus == "settlement" ||
		(notif.TransactionStatus == "capture" && notif.FraudStatus == "accept")

	if isSuccess {
		expiresAt := time.Now().AddDate(0, 0, ProDurationDays)
		h.repo.ActivatePro(r.Context(), notif.OrderID, notif.TransactionID, expiresAt)
	}

	w.WriteHeader(http.StatusOK)
}

// Middleware: check if user has active Pro plan
func RequirePro(subRepo repository.SubscriptionRepository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userID, ok := appmiddleware.GetUserID(r.Context())
			if !ok {
				response.Error(w, http.StatusUnauthorized, "unauthorized")
				return
			}
			sub, _ := subRepo.GetByUserID(r.Context(), userID)
			if sub == nil || !sub.IsPro() {
				response.Error(w, http.StatusPaymentRequired, "pro subscription required")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// Helper to get user's plan for use in handlers
func GetUserPlan(subRepo repository.SubscriptionRepository, userID uuid.UUID, r *http.Request) string {
	sub, _ := subRepo.GetByUserID(r.Context(), userID)
	if sub != nil && sub.IsPro() {
		return "pro"
	}
	return "free"
}