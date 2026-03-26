package handler

import (
	"encoding/json"
	"math"
	"net/http"
	"strconv"
	"time"

	"github.com/dhavisiregar/expense-manager/internal/domain"
	"github.com/dhavisiregar/expense-manager/internal/service"
	"github.com/dhavisiregar/expense-manager/pkg/response"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type ExpenseHandler struct {
	svc *service.ExpenseService
}

func NewExpenseHandler(svc *service.ExpenseService) *ExpenseHandler {
	return &ExpenseHandler{svc: svc}
}

func (h *ExpenseHandler) Routes() func(r chi.Router) {
	return func(r chi.Router) {
		r.Get("/", h.List)
		r.Post("/", h.Create)
		r.Get("/dashboard", h.Dashboard)
		r.Get("/{id}", h.GetByID)
		r.Put("/{id}", h.Update)
		r.Delete("/{id}", h.Delete)
	}
}

// createExpenseRequest accepts date as a plain "YYYY-MM-DD" string from the frontend
type createExpenseRequest struct {
	Title       string   `json:"title"`
	Amount      float64  `json:"amount"`
	CategoryID  string   `json:"category_id"`
	Tags        []string `json:"tags"`
	Date        string   `json:"date"` // "2006-01-02"
	Description string   `json:"description"`
}

// updateExpenseRequest mirrors createExpenseRequest but all fields optional
type updateExpenseRequest struct {
	Title       *string  `json:"title"`
	Amount      *float64 `json:"amount"`
	CategoryID  *string  `json:"category_id"`
	Tags        []string `json:"tags"`
	Date        *string  `json:"date"`
	Description *string  `json:"description"`
}

func parseDate(s string) (time.Time, error) {
	// Accept both "2006-01-02" and full RFC3339
	if t, err := time.Parse("2006-01-02", s); err == nil {
		return t, nil
	}
	return time.Parse(time.RFC3339, s)
}

func (h *ExpenseHandler) Dashboard(w http.ResponseWriter, r *http.Request) {
	summary, err := h.svc.GetDashboardSummary(r.Context())
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, summary)
}

func (h *ExpenseHandler) List(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()
	filter := domain.ExpenseFilter{
		Page:     1,
		PageSize: 20,
	}

	if p := q.Get("page"); p != "" {
		if v, err := strconv.Atoi(p); err == nil {
			filter.Page = v
		}
	}
	if ps := q.Get("page_size"); ps != "" {
		if v, err := strconv.Atoi(ps); err == nil {
			filter.PageSize = v
		}
	}
	if cid := q.Get("category_id"); cid != "" {
		id, err := uuid.Parse(cid)
		if err == nil {
			filter.CategoryID = &id
		}
	}
	if sd := q.Get("start_date"); sd != "" {
		t, err := parseDate(sd)
		if err == nil {
			filter.StartDate = &t
		}
	}
	if ed := q.Get("end_date"); ed != "" {
		t, err := parseDate(ed)
		if err == nil {
			filter.EndDate = &t
		}
	}

	expenses, total, err := h.svc.List(r.Context(), filter)
	if err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	totalPages := int(math.Ceil(float64(total) / float64(filter.PageSize)))
	meta := response.PaginationMeta{
		Page:       filter.Page,
		PageSize:   filter.PageSize,
		TotalItems: total,
		TotalPages: totalPages,
	}

	response.JSONWithMeta(w, http.StatusOK, expenses, meta)
}

func (h *ExpenseHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req createExpenseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	categoryID, err := uuid.Parse(req.CategoryID)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid category_id")
		return
	}

	date, err := parseDate(req.Date)
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid date format, use YYYY-MM-DD")
		return
	}

	tags := req.Tags
	if tags == nil {
		tags = []string{}
	}

	input := domain.CreateExpenseInput{
		Title:       req.Title,
		Amount:      req.Amount,
		CategoryID:  categoryID,
		Tags:        tags,
		Date:        date,
		Description: req.Description,
	}

	expense, err := h.svc.Create(r.Context(), input)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.JSON(w, http.StatusCreated, expense)
}

func (h *ExpenseHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid id")
		return
	}

	expense, err := h.svc.GetByID(r.Context(), id)
	if err != nil {
		response.Error(w, http.StatusNotFound, "expense not found")
		return
	}
	response.JSON(w, http.StatusOK, expense)
}

func (h *ExpenseHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid id")
		return
	}

	var req updateExpenseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.Error(w, http.StatusBadRequest, "invalid request body")
		return
	}

	input := domain.UpdateExpenseInput{
		Title:       req.Title,
		Amount:      req.Amount,
		Tags:        req.Tags,
		Description: req.Description,
	}

	if req.CategoryID != nil {
		catID, err := uuid.Parse(*req.CategoryID)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "invalid category_id")
			return
		}
		input.CategoryID = &catID
	}

	if req.Date != nil {
		t, err := parseDate(*req.Date)
		if err != nil {
			response.Error(w, http.StatusBadRequest, "invalid date format, use YYYY-MM-DD")
			return
		}
		input.Date = &t
	}

	expense, err := h.svc.Update(r.Context(), id, input)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, expense)
}

func (h *ExpenseHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		response.Error(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.svc.Delete(r.Context(), id); err != nil {
		response.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	response.JSON(w, http.StatusOK, map[string]string{"message": "deleted"})
}