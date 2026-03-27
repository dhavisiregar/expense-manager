package service

import (
	"context"
	"fmt"

	"github.com/dhavisiregar/expense-manager/internal/domain"
	"github.com/google/uuid"
)

type IncomeService struct {
	repo domain.IncomeRepository
}

func NewIncomeService(repo domain.IncomeRepository) *IncomeService {
	return &IncomeService{repo: repo}
}

func (s *IncomeService) Create(ctx context.Context, input domain.CreateIncomeInput) (*domain.Income, error) {
	if input.Title == "" {
		return nil, fmt.Errorf("title is required")
	}
	if input.Amount <= 0 {
		return nil, fmt.Errorf("amount must be greater than 0")
	}
	if input.Date.IsZero() {
		return nil, fmt.Errorf("date is required")
	}
	if input.Source == "" {
		input.Source = "Other"
	}
	return s.repo.Create(ctx, input)
}

func (s *IncomeService) GetByID(ctx context.Context, id, userID uuid.UUID) (*domain.Income, error) {
	return s.repo.GetByID(ctx, id, userID)
}

func (s *IncomeService) List(ctx context.Context, filter domain.IncomeFilter) ([]domain.Income, int, error) {
	return s.repo.List(ctx, filter)
}

func (s *IncomeService) Update(ctx context.Context, id, userID uuid.UUID, input domain.UpdateIncomeInput) (*domain.Income, error) {
	if input.Amount != nil && *input.Amount <= 0 {
		return nil, fmt.Errorf("amount must be greater than 0")
	}
	return s.repo.Update(ctx, id, userID, input)
}

func (s *IncomeService) Delete(ctx context.Context, id, userID uuid.UUID) error {
	return s.repo.Delete(ctx, id, userID)
}