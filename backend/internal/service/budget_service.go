package service

import (
	"context"
	"errors"
	"time"

	"github.com/dhavisiregar/expense-manager/internal/domain"
	"github.com/google/uuid"
)

var ErrInvalidPeriod = errors.New("month must be 1-12 and year must be reasonable")

type BudgetService struct {
	repo    domain.BudgetRepository
	catRepo domain.CategoryRepository
}

func NewBudgetService(repo domain.BudgetRepository, catRepo domain.CategoryRepository) *BudgetService {
	return &BudgetService{repo: repo, catRepo: catRepo}
}

func (s *BudgetService) Create(ctx context.Context, input domain.CreateBudgetInput) (*domain.Budget, error) {
	if input.Month < 1 || input.Month > 12 || input.Year < 2000 {
		return nil, ErrInvalidPeriod
	}
	if input.LimitAmount <= 0 {
		return nil, errors.New("limit_amount must be greater than zero")
	}
	if input.AlertThresholdPct == 0 {
		input.AlertThresholdPct = 80 // sensible default: warn at 80% spent
	}
	// Confirm the category belongs to this user before attaching a budget to it.
	if _, err := s.catRepo.GetByID(ctx, input.CategoryID, input.UserID); err != nil {
		return nil, err
	}
	return s.repo.Create(ctx, input)
}

func (s *BudgetService) Update(ctx context.Context, id uuid.UUID, userID string, input domain.UpdateBudgetInput) (*domain.Budget, error) {
	if input.LimitAmount != nil && *input.LimitAmount <= 0 {
		return nil, errors.New("limit_amount must be greater than zero")
	}
	if input.AlertThresholdPct != nil && (*input.AlertThresholdPct < 1 || *input.AlertThresholdPct > 100) {
		return nil, errors.New("alert_threshold_pct must be between 1 and 100")
	}
	return s.repo.Update(ctx, id, userID, input)
}

func (s *BudgetService) Delete(ctx context.Context, id uuid.UUID, userID string) error {
	return s.repo.Delete(ctx, id, userID)
}

// GetStatusForPeriod returns every budget for the period joined with actual
// spend, so the frontend can render progress bars / alerts in one call.
// Defaults to the current month/year when month/year are 0.
func (s *BudgetService) GetStatusForPeriod(ctx context.Context, userID string, month, year int16) ([]domain.BudgetStatus, error) {
	if month == 0 || year == 0 {
		now := time.Now()
		month = int16(now.Month())
		year = int16(now.Year())
	}

	budgets, err := s.repo.ListByPeriod(ctx, userID, month, year)
	if err != nil {
		return nil, err
	}
	if len(budgets) == 0 {
		return []domain.BudgetStatus{}, nil
	}

	spentByCategory, err := s.repo.GetSpentByCategory(ctx, userID, month, year)
	if err != nil {
		return nil, err
	}

	statuses := make([]domain.BudgetStatus, 0, len(budgets))
	for _, b := range budgets {
		cat, err := s.catRepo.GetByID(ctx, b.CategoryID, userID)
		if err != nil {
			continue // category deleted/inaccessible; skip rather than fail the whole list
		}

		spent := spentByCategory[b.CategoryID]
		remaining := b.LimitAmount - spent
		usagePct := 0.0
		if b.LimitAmount > 0 {
			usagePct = (spent / b.LimitAmount) * 100
		}

		statuses = append(statuses, domain.BudgetStatus{
			Budget:       b,
			CategoryName: cat.Name,
			CategoryIcon: cat.Icon,
			Spent:        spent,
			Remaining:    remaining,
			UsagePct:     usagePct,
			IsOverLimit:  spent > b.LimitAmount,
			IsNearLimit:  usagePct >= float64(b.AlertThresholdPct) && spent <= b.LimitAmount,
		})
	}
	return statuses, nil
}
