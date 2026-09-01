package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/dhavisiregar/expense-manager/internal/domain"
	appmiddleware "github.com/dhavisiregar/expense-manager/internal/middleware"
	"github.com/dhavisiregar/expense-manager/internal/service"
	"github.com/dhavisiregar/expense-manager/pkg/response"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type BudgetHandler struct{ svc *service.BudgetService }

func NewBudgetHandler(svc *service.BudgetService) *BudgetHandler { return &BudgetHandler{svc: svc} }

func (h *BudgetHandler) Routes() func(r chi.Router) {
	return func(r chi.Router) {
		r.Get("/", h.ListStatus)
		r.Post("/", h.Create)
		r.Put("/{id}", h.Update)
		r.Delete("/{id}", h.Delete)
	}
}

type createBudgetRequest struct {
	CategoryID        string  `json:"category_id"`
	Month             int16   `json:"month"`
	Year              int16   `json:"year"`
	LimitAmount       float64 `json:"limit_amount"`
	AlertThresholdPct int16   `json:"alert_threshold_pct"`
}

type updateBudgetRequest struct {
	LimitAmount       *float64 `json:"limit_amount"`
	AlertThresholdPct *int16   `json:"alert_threshold_pct"`
}

// ListStatus returns budgets for a period joined with actual spend + alert flags.
// Query params: ?month=9&year=2026 (defaults to current month/year if omitted).
func (h *BudgetHandler) ListStatus(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmiddleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	q := r.URL.Query()
	var month, year int16
	if m := q.Get("month"); m != "" {
		v, err := strconv.Atoi(m)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "invalid month")
			return
		}
		month = int16(v)
	}
	if y := q.Get("year"); y != "" {
		v, err := strconv.Atoi(y)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "invalid year")
			return
		}
		year = int16(v)
	}

	statuses, err := h.svc.GetStatusForPeriod(r.Context(), userID, month, year)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, statuses)
}

func (h *BudgetHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmiddleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	var req createBudgetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}
	catID, err := uuid.Parse(req.CategoryID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid category_id")
		return
	}

	b, err := h.svc.Create(r.Context(), domain.CreateBudgetInput{
		UserID:            userID,
		CategoryID:        catID,
		Month:             req.Month,
		Year:              req.Year,
		LimitAmount:       req.LimitAmount,
		AlertThresholdPct: req.AlertThresholdPct,
	})
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.JSON(w, http.StatusCreated, b)
}

func (h *BudgetHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmiddleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid id")
		return
	}

	var req updateBudgetRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	b, err := h.svc.Update(r.Context(), id, userID, domain.UpdateBudgetInput{
		LimitAmount:       req.LimitAmount,
		AlertThresholdPct: req.AlertThresholdPct,
	})
	if errors.Is(err, domain.ErrNotFound) {
		response.Error(w, http.StatusNotFound, "budget not found")
		return
	}
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, b)
}

func (h *BudgetHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmiddleware.GetUserID(r.Context())
	if !ok {
		response.Error(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	if err := h.svc.Delete(r.Context(), id, userID); err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			response.Error(w, http.StatusNotFound, "budget not found")
			return
		}
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}
