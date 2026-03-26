package domain

import (
	"context"

	"github.com/google/uuid"
)

type IncomeRepository interface {
	Create(ctx context.Context, input CreateIncomeInput) (*Income, error)
	GetByID(ctx context.Context, id uuid.UUID) (*Income, error)
	List(ctx context.Context, filter IncomeFilter) ([]Income, int, error)
	Update(ctx context.Context, id uuid.UUID, input UpdateIncomeInput) (*Income, error)
	Delete(ctx context.Context, id uuid.UUID) error
}