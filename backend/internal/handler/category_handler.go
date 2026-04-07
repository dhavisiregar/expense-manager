package handler

import (
	"encoding/json"
	"net/http"

	"github.com/dhavisiregar/expense-manager/internal/domain"
	appmiddleware "github.com/dhavisiregar/expense-manager/internal/middleware"
	"github.com/dhavisiregar/expense-manager/internal/repository"
	"github.com/dhavisiregar/expense-manager/internal/service"
	"github.com/dhavisiregar/expense-manager/pkg/response"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type CategoryHandler struct{
	svc     *service.CategoryService
	subRepo repository.SubscriptionRepository
}

func NewCategoryHandler(svc *service.CategoryService, subRepo repository.SubscriptionRepository) *CategoryHandler {
	return &CategoryHandler{svc: svc, subRepo: subRepo}
}

func (h *CategoryHandler) Routes() func(r chi.Router) {
	return func(r chi.Router) {
		r.Get("/", h.List)
		r.Post("/", h.Create)
		r.Post("/seed", h.Seed)
		r.Get("/{id}", h.GetByID)
		r.Put("/{id}", h.Update)
		r.Delete("/{id}", h.Delete)
	}
}

func (h *CategoryHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmiddleware.GetUserID(r.Context())
	if !ok { response.Error(w, http.StatusUnauthorized, "unauthorized"); return }
	cats, err := h.svc.List(r.Context(), userID)
	if err != nil { response.Error(w, http.StatusInternalServerError, err.Error()); return }
	response.JSON(w, http.StatusOK, cats)
}

func (h *CategoryHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmiddleware.GetUserID(r.Context())
	if !ok { response.Error(w, http.StatusUnauthorized, "unauthorized"); return }
	var input domain.CreateCategoryInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body"); return
	}
	input.UserID = userID
	sub, _ := h.subRepo.GetByUserID(r.Context(), userID)
	isPro := sub != nil && sub.IsPro()
	cat, err := h.svc.Create(r.Context(), input, isPro)
	if err != nil { response.Error(w, http.StatusBadRequest, err.Error()); return }
	response.JSON(w, http.StatusCreated, cat)
}

func (h *CategoryHandler) Seed(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmiddleware.GetUserID(r.Context())
	if !ok { response.Error(w, http.StatusUnauthorized, "unauthorized"); return }
	if err := h.svc.SeedDefaults(r.Context(), userID); err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error()); return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "default categories created"})
}

func (h *CategoryHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmiddleware.GetUserID(r.Context())
	if !ok { response.Error(w, http.StatusUnauthorized, "unauthorized"); return }
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil { response.Error(w, http.StatusBadRequest, "invalid id"); return }
	cat, err := h.svc.GetByID(r.Context(), id, userID)
	if err != nil { response.Error(w, http.StatusNotFound, "category not found"); return }
	response.JSON(w, http.StatusOK, cat)
}

func (h *CategoryHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmiddleware.GetUserID(r.Context())
	if !ok { response.Error(w, http.StatusUnauthorized, "unauthorized"); return }
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil { response.Error(w, http.StatusBadRequest, "invalid id"); return }
	var input domain.UpdateCategoryInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body"); return
	}
	cat, err := h.svc.Update(r.Context(), id, userID, input)
	if err != nil { response.Error(w, http.StatusBadRequest, err.Error()); return }
	response.JSON(w, http.StatusOK, cat)
}

func (h *CategoryHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmiddleware.GetUserID(r.Context())
	if !ok { response.Error(w, http.StatusUnauthorized, "unauthorized"); return }
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil { response.Error(w, http.StatusBadRequest, "invalid id"); return }
	if err := h.svc.Delete(r.Context(), id, userID); err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error()); return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}