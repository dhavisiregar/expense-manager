package domain

import (
	"context"

	"github.com/google/uuid"
)

type ExpenseRepository interface {
	Create(ctx context.Context, input CreateExpenseInput) (*Expense, error)
	GetByID(ctx context.Context, id, userID uuid.UUID) (*Expense, error)
	List(ctx context.Context, filter ExpenseFilter) ([]Expense, int, error)
	Update(ctx context.Context, id, userID uuid.UUID, input UpdateExpenseInput) (*Expense, error)
	Delete(ctx context.Context, id, userID uuid.UUID) error
	GetDashboardSummary(ctx context.Context, userID uuid.UUID) (*DashboardSummary, error)
}

type CategoryRepository interface {
	Create(ctx context.Context, input CreateCategoryInput) (*Category, error)
	GetByID(ctx context.Context, id, userID uuid.UUID) (*Category, error)
	List(ctx context.Context, userID uuid.UUID) ([]Category, error)
	Update(ctx context.Context, id, userID uuid.UUID, input UpdateCategoryInput) (*Category, error)
	Delete(ctx context.Context, id, userID uuid.UUID) error
}

type IncomeRepository interface {
	Create(ctx context.Context, input CreateIncomeInput) (*Income, error)
	GetByID(ctx context.Context, id, userID uuid.UUID) (*Income, error)
	List(ctx context.Context, filter IncomeFilter) ([]Income, int, error)
	Update(ctx context.Context, id, userID uuid.UUID, input UpdateIncomeInput) (*Income, error)
	Delete(ctx context.Context, id, userID uuid.UUID) error
}