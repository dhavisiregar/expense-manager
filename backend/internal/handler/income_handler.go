package handler

import (
	"encoding/json"
	"math"
	"net/http"
	"strconv"

	"github.com/dhavisiregar/expense-manager/internal/domain"
	appmiddleware "github.com/dhavisiregar/expense-manager/internal/middleware"
	"github.com/dhavisiregar/expense-manager/internal/service"
	"github.com/dhavisiregar/expense-manager/pkg/response"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type IncomeHandler struct{ svc *service.IncomeService }

func NewIncomeHandler(svc *service.IncomeService) *IncomeHandler { return &IncomeHandler{svc: svc} }

func (h *IncomeHandler) Routes() func(r chi.Router) {
	return func(r chi.Router) {
		r.Get("/", h.List)
		r.Post("/", h.Create)
		r.Get("/{id}", h.GetByID)
		r.Put("/{id}", h.Update)
		r.Delete("/{id}", h.Delete)
	}
}

type createIncomeRequest struct {
	Title       string  `json:"title"`
	Amount      float64 `json:"amount"`
	Source      string  `json:"source"`
	Date        string  `json:"date"`
	Description string  `json:"description"`
}

type updateIncomeRequest struct {
	Title       *string  `json:"title"`
	Amount      *float64 `json:"amount"`
	Source      *string  `json:"source"`
	Date        *string  `json:"date"`
	Description *string  `json:"description"`
}

func (h *IncomeHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmiddleware.GetUserID(r.Context())
	if !ok { response.Error(w, http.StatusUnauthorized, "unauthorized"); return }
	q := r.URL.Query()
	filter := domain.IncomeFilter{UserID: userID, Page: 1, PageSize: 20}
	if p := q.Get("page"); p != "" { if v, err := strconv.Atoi(p); err == nil { filter.Page = v } }
	if ps := q.Get("page_size"); ps != "" { if v, err := strconv.Atoi(ps); err == nil { filter.PageSize = v } }
	if sd := q.Get("start_date"); sd != "" { if t, err := parseDate(sd); err == nil { filter.StartDate = &t } }
	if ed := q.Get("end_date"); ed != "" { if t, err := parseDate(ed); err == nil { filter.EndDate = &t } }
	incomes, total, err := h.svc.List(r.Context(), filter)
	if err != nil { response.Error(w, http.StatusInternalServerError, err.Error()); return }
	response.JSONWithMeta(w, http.StatusOK, incomes, response.PaginationMeta{
		Page: filter.Page, PageSize: filter.PageSize, TotalItems: total,
		TotalPages: int(math.Ceil(float64(total) / float64(filter.PageSize))),
	})
}

func (h *IncomeHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmiddleware.GetUserID(r.Context())
	if !ok { response.Error(w, http.StatusUnauthorized, "unauthorized"); return }
	var req createIncomeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body"); return
	}
	date, err := parseDate(req.Date)
	if err != nil { response.Error(w, http.StatusBadRequest, "invalid date format, use YYYY-MM-DD"); return }
	income, err := h.svc.Create(r.Context(), domain.CreateIncomeInput{
		UserID: userID, Title: req.Title, Amount: req.Amount,
		Source: req.Source, Date: date, Description: req.Description,
	})
	if err != nil { response.Error(w, http.StatusBadRequest, err.Error()); return }
	response.JSON(w, http.StatusCreated, income)
}

func (h *IncomeHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmiddleware.GetUserID(r.Context())
	if !ok { response.Error(w, http.StatusUnauthorized, "unauthorized"); return }
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil { response.Error(w, http.StatusBadRequest, "invalid id"); return }
	inc, err := h.svc.GetByID(r.Context(), id, userID)
	if err != nil { response.Error(w, http.StatusNotFound, "income not found"); return }
	response.JSON(w, http.StatusOK, inc)
}

func (h *IncomeHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmiddleware.GetUserID(r.Context())
	if !ok { response.Error(w, http.StatusUnauthorized, "unauthorized"); return }
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil { response.Error(w, http.StatusBadRequest, "invalid id"); return }
	var req updateIncomeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body"); return
	}
	input := domain.UpdateIncomeInput{Title: req.Title, Amount: req.Amount, Source: req.Source, Description: req.Description}
	if req.Date != nil {
		t, err := parseDate(*req.Date)
		if err != nil { response.Error(w, http.StatusBadRequest, "invalid date"); return }
		input.Date = &t
	}
	inc, err := h.svc.Update(r.Context(), id, userID, input)
	if err != nil { response.Error(w, http.StatusBadRequest, err.Error()); return }
	response.JSON(w, http.StatusOK, inc)
}

func (h *IncomeHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := appmiddleware.GetUserID(r.Context())
	if !ok { response.Error(w, http.StatusUnauthorized, "unauthorized"); return }
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil { response.Error(w, http.StatusBadRequest, "invalid id"); return }
	if err := h.svc.Delete(r.Context(), id, userID); err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error()); return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}