package domain

import (
	"context"

	"github.com/google/uuid"
)

type ExpenseRepository interface {
	Create(ctx context.Context, input CreateExpenseInput) (*Expense, error)
	GetByID(ctx context.Context, id uuid.UUID, userID string) (*Expense, error)
	List(ctx context.Context, filter ExpenseFilter) ([]Expense, int, error)
	Update(ctx context.Context, id uuid.UUID, userID string, input UpdateExpenseInput) (*Expense, error)
	Delete(ctx context.Context, id uuid.UUID, userID string) error
	GetDashboardSummary(ctx context.Context, userID string) (*DashboardSummary, error)
}

type CategoryRepository interface {
	Create(ctx context.Context, input CreateCategoryInput) (*Category, error)
	GetByID(ctx context.Context, id uuid.UUID, userID string) (*Category, error)
	List(ctx context.Context, userID string) ([]Category, error)
	Update(ctx context.Context, id uuid.UUID, userID string, input UpdateCategoryInput) (*Category, error)
	Delete(ctx context.Context, id uuid.UUID, userID string) error
}

type IncomeRepository interface {
	Create(ctx context.Context, input CreateIncomeInput) (*Income, error)
	GetByID(ctx context.Context, id uuid.UUID, userID string) (*Income, error)
	List(ctx context.Context, filter IncomeFilter) ([]Income, int, error)
	Update(ctx context.Context, id uuid.UUID, userID string, input UpdateIncomeInput) (*Income, error)
	Delete(ctx context.Context, id uuid.UUID, userID string) error
}

type BudgetRepository interface {
	Create(ctx context.Context, input CreateBudgetInput) (*Budget, error)
	GetByID(ctx context.Context, id uuid.UUID, userID string) (*Budget, error)
	ListByPeriod(ctx context.Context, userID string, month, year int16) ([]Budget, error)
	Update(ctx context.Context, id uuid.UUID, userID string, input UpdateBudgetInput) (*Budget, error)
	Delete(ctx context.Context, id uuid.UUID, userID string) error
	// GetSpentByCategory returns total expense amount per category for a period.
	GetSpentByCategory(ctx context.Context, userID string, month, year int16) (map[uuid.UUID]float64, error)
}
