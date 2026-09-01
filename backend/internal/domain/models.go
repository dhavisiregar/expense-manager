package domain

import (
	"time"

	"github.com/google/uuid"
)

type Category struct {
	ID        uuid.UUID `json:"id"`
	UserID    string    `json:"user_id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	Icon      string    `json:"icon"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Expense struct {
	ID          uuid.UUID `json:"id"`
	UserID      string    `json:"user_id"`
	Title       string    `json:"title"`
	Amount      float64   `json:"amount"`
	CategoryID  uuid.UUID `json:"category_id"`
	Category    *Category `json:"category,omitempty"`
	Tags        []string  `json:"tags"`
	Date        time.Time `json:"date"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Income struct {
	ID          uuid.UUID `json:"id"`
	UserID      string    `json:"user_id"`
	Title       string    `json:"title"`
	Amount      float64   `json:"amount"`
	Source      string    `json:"source"`
	Date        time.Time `json:"date"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateExpenseInput struct {
	UserID      string    `json:"user_id"`
	Title       string    `json:"title"`
	Amount      float64   `json:"amount"`
	CategoryID  uuid.UUID `json:"category_id"`
	Tags        []string  `json:"tags"`
	Date        time.Time `json:"date"`
	Description string    `json:"description"`
}

type UpdateExpenseInput struct {
	Title       *string    `json:"title"`
	Amount      *float64   `json:"amount"`
	CategoryID  *uuid.UUID `json:"category_id"`
	Tags        []string   `json:"tags"`
	Date        *time.Time `json:"date"`
	Description *string    `json:"description"`
}

type CreateCategoryInput struct {
	UserID string `json:"user_id"`
	Name   string `json:"name"`
	Color  string `json:"color"`
	Icon   string `json:"icon"`
}

type UpdateCategoryInput struct {
	Name  *string `json:"name"`
	Color *string `json:"color"`
	Icon  *string `json:"icon"`
}

type CreateIncomeInput struct {
	UserID      string    `json:"user_id"`
	Title       string    `json:"title"`
	Amount      float64   `json:"amount"`
	Source      string    `json:"source"`
	Date        time.Time `json:"date"`
	Description string    `json:"description"`
}

type UpdateIncomeInput struct {
	Title       *string    `json:"title"`
	Amount      *float64   `json:"amount"`
	Source      *string    `json:"source"`
	Date        *time.Time `json:"date"`
	Description *string    `json:"description"`
}

type ExpenseFilter struct {
	UserID     string
	CategoryID *uuid.UUID
	StartDate  *time.Time
	EndDate    *time.Time
	Tags       []string
	Page       int
	PageSize   int
}

type IncomeFilter struct {
	UserID    string
	StartDate *time.Time
	EndDate   *time.Time
	Page      int
	PageSize  int
}

type DashboardSummary struct {
	TotalExpenses   float64           `json:"total_expenses"`
	MonthlyExpenses float64           `json:"monthly_expenses"`
	ExpenseCount    int               `json:"expense_count"`
	TotalIncome     float64           `json:"total_income"`
	MonthlyIncome   float64           `json:"monthly_income"`
	Balance         float64           `json:"balance"`
	MonthlyBalance  float64           `json:"monthly_balance"`
	ByCategory      []CategorySummary `json:"by_category"`
	MonthlyTrend    []MonthlyTrend    `json:"monthly_trend"`
	RecentExpenses  []Expense         `json:"recent_expenses"`
}

type CategorySummary struct {
	Category *Category `json:"category"`
	Total    float64   `json:"total"`
	Count    int       `json:"count"`
	Percent  float64   `json:"percent"`
}

type MonthlyTrend struct {
	Month  string  `json:"month"`
	Year   int     `json:"year"`
	Total  float64 `json:"total"`
	Income float64 `json:"income"`
	Count  int     `json:"count"`
}

type Subscription struct {
	ID              string     `json:"id"`
	UserID          string     `json:"user_id"`
	Plan            string     `json:"plan"`
	Status          string     `json:"status"`
	MidtransOrderID *string    `json:"midtrans_order_id,omitempty"`
	MidtransTxID    *string    `json:"midtrans_tx_id,omitempty"`
	StartedAt       *time.Time `json:"started_at,omitempty"`
	ExpiresAt       *time.Time `json:"expires_at,omitempty"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

func (s *Subscription) IsPro() bool {
	if s.Plan != "pro" {
		return false
	}
	if s.Status != "active" {
		return false
	}
	if s.ExpiresAt != nil && time.Now().After(*s.ExpiresAt) {
		return false
	}
	return true
}

// Budget is a per-user, per-category spending limit for a given month/year.
type Budget struct {
	ID                uuid.UUID `json:"id"`
	UserID            string    `json:"user_id"`
	CategoryID        uuid.UUID `json:"category_id"`
	Month             int16     `json:"month"`
	Year              int16     `json:"year"`
	LimitAmount       float64   `json:"limit_amount"`
	AlertThresholdPct int16     `json:"alert_threshold_pct"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// BudgetStatus is a computed view: budget + actual spend + alert state.
// This is what the budgets page / alert UI consumes, not the raw row.
type BudgetStatus struct {
	Budget
	CategoryName string  `json:"category_name"`
	CategoryIcon string  `json:"category_icon"`
	Spent        float64 `json:"spent"`
	Remaining    float64 `json:"remaining"`
	UsagePct     float64 `json:"usage_pct"`
	IsOverLimit  bool    `json:"is_over_limit"`
	IsNearLimit  bool    `json:"is_near_limit"` // usage_pct >= alert_threshold_pct
}

type CreateBudgetInput struct {
	UserID            string    `json:"user_id"`
	CategoryID        uuid.UUID `json:"category_id"`
	Month             int16     `json:"month"`
	Year              int16     `json:"year"`
	LimitAmount       float64   `json:"limit_amount"`
	AlertThresholdPct int16     `json:"alert_threshold_pct"`
}

type UpdateBudgetInput struct {
	LimitAmount       *float64 `json:"limit_amount"`
	AlertThresholdPct *int16   `json:"alert_threshold_pct"`
}
