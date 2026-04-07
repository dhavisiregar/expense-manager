package domain

import (
	"time"

	"github.com/google/uuid"
)

type Category struct {
	ID        uuid.UUID `json:"id"`
	UserID    uuid.UUID `json:"user_id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	Icon      string    `json:"icon"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Expense struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"user_id"`
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
	UserID      uuid.UUID `json:"user_id"`
	Title       string    `json:"title"`
	Amount      float64   `json:"amount"`
	Source      string    `json:"source"`
	Date        time.Time `json:"date"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateExpenseInput struct {
	UserID      uuid.UUID `json:"user_id"`
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
	UserID uuid.UUID `json:"user_id"`
	Name   string    `json:"name"`
	Color  string    `json:"color"`
	Icon   string    `json:"icon"`
}

type UpdateCategoryInput struct {
	Name  *string `json:"name"`
	Color *string `json:"color"`
	Icon  *string `json:"icon"`
}

type CreateIncomeInput struct {
	UserID      uuid.UUID `json:"user_id"`
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
	UserID     uuid.UUID
	CategoryID *uuid.UUID
	StartDate  *time.Time
	EndDate    *time.Time
	Tags       []string
	Page       int
	PageSize   int
}

type IncomeFilter struct {
	UserID    uuid.UUID
	StartDate *time.Time
	EndDate   *time.Time
	Page      int
	PageSize  int
}

type DashboardSummary struct {
	TotalExpenses  float64           `json:"total_expenses"`
	MonthlyExpenses float64          `json:"monthly_expenses"`
	ExpenseCount   int               `json:"expense_count"`
	TotalIncome    float64           `json:"total_income"`
	MonthlyIncome  float64           `json:"monthly_income"`
	Balance        float64           `json:"balance"`
	MonthlyBalance float64           `json:"monthly_balance"`
	ByCategory     []CategorySummary `json:"by_category"`
	MonthlyTrend   []MonthlyTrend    `json:"monthly_trend"`
	RecentExpenses []Expense         `json:"recent_expenses"`
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
	ID               string     `json:"id"`
	UserID           string     `json:"user_id"`
	Plan             string     `json:"plan"`    // "free" | "pro"
	Status           string     `json:"status"`  // "active" | "expired" | "cancelled"
	MidtransOrderID  *string    `json:"midtrans_order_id,omitempty"`
	MidtransTxID     *string    `json:"midtrans_tx_id,omitempty"`
	StartedAt        *time.Time `json:"started_at,omitempty"`
	ExpiresAt        *time.Time `json:"expires_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

func (s *Subscription) IsPro() bool {
	if s.Plan != "pro" { return false }
	if s.Status != "active" { return false }
	if s.ExpiresAt != nil && time.Now().After(*s.ExpiresAt) { return false }
	return true
}