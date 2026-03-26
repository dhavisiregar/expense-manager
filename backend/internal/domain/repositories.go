package domain

import (
	"context"

	"github.com/google/uuid"
)

type ExpenseRepository interface {
	Create(ctx context.Context, input CreateExpenseInput) (*Expense, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Expense, error)
	List(ctx context.Context, filter ExpenseFilter) ([]Expense, int, error)
	Update(ctx context.Context, id uuid.UUID, input UpdateExpenseInput) (*Expense, error)
	Delete(ctx context.Context, id uuid.UUID) error
	GetDashboardSummary(ctx context.Context) (*DashboardSummary, error)
}

type CategoryRepository interface {
	Create(ctx context.Context, input CreateCategoryInput) (*Category, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Category, error)
	List(ctx context.Context) ([]Category, error)
	Update(ctx context.Context, id uuid.UUID, input UpdateCategoryInput) (*Category, error)
	Delete(ctx context.Context, id uuid.UUID) error
}