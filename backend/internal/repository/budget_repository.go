package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/dhavisiregar/expense-manager/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type budgetRepo struct {
	db *pgxpool.Pool
}

func NewBudgetRepository(db *pgxpool.Pool) domain.BudgetRepository {
	return &budgetRepo{db: db}
}

func (r *budgetRepo) Create(ctx context.Context, input domain.CreateBudgetInput) (*domain.Budget, error) {
	query := `
		INSERT INTO budgets (id, user_id, category_id, month, year, limit_amount, alert_threshold_pct, created_at, updated_at)
		VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
		RETURNING id, user_id, category_id, month, year, limit_amount, alert_threshold_pct, created_at, updated_at
	`
	b := &domain.Budget{}
	err := r.db.QueryRow(ctx, query,
		input.UserID, input.CategoryID, input.Month, input.Year, input.LimitAmount, input.AlertThresholdPct,
	).Scan(&b.ID, &b.UserID, &b.CategoryID, &b.Month, &b.Year, &b.LimitAmount, &b.AlertThresholdPct, &b.CreatedAt, &b.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create budget: %w", err)
	}
	return b, nil
}

func (r *budgetRepo) GetByID(ctx context.Context, id uuid.UUID, userID string) (*domain.Budget, error) {
	query := `
		SELECT id, user_id, category_id, month, year, limit_amount, alert_threshold_pct, created_at, updated_at
		FROM budgets WHERE id = $1 AND user_id = $2
	`
	b := &domain.Budget{}
	err := r.db.QueryRow(ctx, query, id, userID).
		Scan(&b.ID, &b.UserID, &b.CategoryID, &b.Month, &b.Year, &b.LimitAmount, &b.AlertThresholdPct, &b.CreatedAt, &b.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get budget: %w", err)
	}
	return b, nil
}

func (r *budgetRepo) ListByPeriod(ctx context.Context, userID string, month, year int16) ([]domain.Budget, error) {
	query := `
		SELECT id, user_id, category_id, month, year, limit_amount, alert_threshold_pct, created_at, updated_at
		FROM budgets
		WHERE user_id = $1 AND month = $2 AND year = $3
		ORDER BY created_at ASC
	`
	rows, err := r.db.Query(ctx, query, userID, month, year)
	if err != nil {
		return nil, fmt.Errorf("list budgets: %w", err)
	}
	defer rows.Close()

	var out []domain.Budget
	for rows.Next() {
		var b domain.Budget
		if err := rows.Scan(&b.ID, &b.UserID, &b.CategoryID, &b.Month, &b.Year, &b.LimitAmount, &b.AlertThresholdPct, &b.CreatedAt, &b.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan budget: %w", err)
		}
		out = append(out, b)
	}
	return out, rows.Err()
}

func (r *budgetRepo) Update(ctx context.Context, id uuid.UUID, userID string, input domain.UpdateBudgetInput) (*domain.Budget, error) {
	query := `
		UPDATE budgets SET
			limit_amount = COALESCE($3, limit_amount),
			alert_threshold_pct = COALESCE($4, alert_threshold_pct),
			updated_at = NOW()
		WHERE id = $1 AND user_id = $2
		RETURNING id, user_id, category_id, month, year, limit_amount, alert_threshold_pct, created_at, updated_at
	`
	b := &domain.Budget{}
	err := r.db.QueryRow(ctx, query, id, userID, input.LimitAmount, input.AlertThresholdPct).
		Scan(&b.ID, &b.UserID, &b.CategoryID, &b.Month, &b.Year, &b.LimitAmount, &b.AlertThresholdPct, &b.CreatedAt, &b.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("update budget: %w", err)
	}
	return b, nil
}

func (r *budgetRepo) Delete(ctx context.Context, id uuid.UUID, userID string) error {
	tag, err := r.db.Exec(ctx, `DELETE FROM budgets WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		return fmt.Errorf("delete budget: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

// GetSpentByCategory sums expenses for the given month/year, grouped by category.
func (r *budgetRepo) GetSpentByCategory(ctx context.Context, userID string, month, year int16) (map[uuid.UUID]float64, error) {
	query := `
		SELECT category_id, COALESCE(SUM(amount), 0)
		FROM expenses
		WHERE user_id = $1
		  AND EXTRACT(MONTH FROM date) = $2
		  AND EXTRACT(YEAR FROM date) = $3
		GROUP BY category_id
	`
	rows, err := r.db.Query(ctx, query, userID, month, year)
	if err != nil {
		return nil, fmt.Errorf("get spent by category: %w", err)
	}
	defer rows.Close()

	out := make(map[uuid.UUID]float64)
	for rows.Next() {
		var catID uuid.UUID
		var spent float64
		if err := rows.Scan(&catID, &spent); err != nil {
			return nil, fmt.Errorf("scan spent: %w", err)
		}
		out[catID] = spent
	}
	return out, rows.Err()
}
