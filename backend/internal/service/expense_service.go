package service

import (
	"context"
	"fmt"

	"github.com/dhavisiregar/expense-manager/internal/domain"
	"github.com/google/uuid"
)

type ExpenseService struct {
	repo domain.ExpenseRepository
}

func NewExpenseService(repo domain.ExpenseRepository) *ExpenseService {
	return &ExpenseService{repo: repo}
}

func (s *ExpenseService) Create(ctx context.Context, input domain.CreateExpenseInput) (*domain.Expense, error) {
	if input.Title == "" {
		return nil, fmt.Errorf("title is required")
	}
	if input.Amount <= 0 {
		return nil, fmt.Errorf("amount must be greater than 0")
	}
	if input.CategoryID == uuid.Nil {
		return nil, fmt.Errorf("category is required")
	}
	if input.Date.IsZero() {
		return nil, fmt.Errorf("date is required")
	}
	return s.repo.Create(ctx, input)
}

func (s *ExpenseService) GetByID(ctx context.Context, id, userID uuid.UUID) (*domain.Expense, error) {
	return s.repo.GetByID(ctx, id, userID)
}

func (s *ExpenseService) List(ctx context.Context, filter domain.ExpenseFilter) ([]domain.Expense, int, error) {
	return s.repo.List(ctx, filter)
}

func (s *ExpenseService) Update(ctx context.Context, id, userID uuid.UUID, input domain.UpdateExpenseInput) (*domain.Expense, error) {
	if input.Amount != nil && *input.Amount <= 0 {
		return nil, fmt.Errorf("amount must be greater than 0")
	}
	return s.repo.Update(ctx, id, userID, input)
}

func (s *ExpenseService) Delete(ctx context.Context, id, userID uuid.UUID) error {
	return s.repo.Delete(ctx, id, userID)
}

func (s *ExpenseService) GetDashboardSummary(ctx context.Context, userID uuid.UUID) (*domain.DashboardSummary, error) {
	return s.repo.GetDashboardSummary(ctx, userID)
}