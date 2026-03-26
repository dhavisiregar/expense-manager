package repository

import (
	"context"
	"fmt"
	"math"
	"strings"

	"github.com/dhavisiregar/expense-manager/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type incomeRepo struct {
	db *pgxpool.Pool
}

func NewIncomeRepository(db *pgxpool.Pool) domain.IncomeRepository {
	return &incomeRepo{db: db}
}

func (r *incomeRepo) Create(ctx context.Context, input domain.CreateIncomeInput) (*domain.Income, error) {
	query := `
		INSERT INTO incomes (id, title, amount, source, date, description, created_at, updated_at)
		VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id, title, amount, source, date, description, created_at, updated_at
	`
	inc := &domain.Income{}
	err := r.db.QueryRow(ctx, query,
		input.Title, input.Amount, input.Source, input.Date, input.Description,
	).Scan(&inc.ID, &inc.Title, &inc.Amount, &inc.Source, &inc.Date, &inc.Description, &inc.CreatedAt, &inc.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create income: %w", err)
	}
	return inc, nil
}

func (r *incomeRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Income, error) {
	query := `SELECT id, title, amount, source, date, description, created_at, updated_at FROM incomes WHERE id = $1`
	inc := &domain.Income{}
	err := r.db.QueryRow(ctx, query, id).
		Scan(&inc.ID, &inc.Title, &inc.Amount, &inc.Source, &inc.Date, &inc.Description, &inc.CreatedAt, &inc.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("get income by id: %w", err)
	}
	return inc, nil
}

func (r *incomeRepo) List(ctx context.Context, filter domain.IncomeFilter) ([]domain.Income, int, error) {
	args := []interface{}{}
	argN := 1
	conditions := []string{}

	if filter.StartDate != nil {
		conditions = append(conditions, fmt.Sprintf("date >= $%d", argN))
		args = append(args, *filter.StartDate)
		argN++
	}
	if filter.EndDate != nil {
		conditions = append(conditions, fmt.Sprintf("date <= $%d", argN))
		args = append(args, *filter.EndDate)
		argN++
	}

	where := ""
	if len(conditions) > 0 {
		where = "WHERE " + strings.Join(conditions, " AND ")
	}

	var total int
	if err := r.db.QueryRow(ctx, fmt.Sprintf("SELECT COUNT(*) FROM incomes %s", where), args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count incomes: %w", err)
	}

	page := filter.Page
	if page < 1 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize < 1 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	query := fmt.Sprintf(`
		SELECT id, title, amount, source, date, description, created_at, updated_at
		FROM incomes %s
		ORDER BY date DESC, created_at DESC
		LIMIT $%d OFFSET $%d
	`, where, argN, argN+1)
	args = append(args, pageSize, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list incomes: %w", err)
	}
	defer rows.Close()

	var incomes []domain.Income
	for rows.Next() {
		var inc domain.Income
		if err := rows.Scan(&inc.ID, &inc.Title, &inc.Amount, &inc.Source, &inc.Date, &inc.Description, &inc.CreatedAt, &inc.UpdatedAt); err != nil {
			return nil, 0, fmt.Errorf("scan income: %w", err)
		}
		incomes = append(incomes, inc)
	}

	_ = math.Ceil(0) // keep math import
	return incomes, total, nil
}

func (r *incomeRepo) Update(ctx context.Context, id uuid.UUID, input domain.UpdateIncomeInput) (*domain.Income, error) {
	query := `
		UPDATE incomes SET
			title       = COALESCE($2, title),
			amount      = COALESCE($3, amount),
			source      = COALESCE($4, source),
			date        = COALESCE($5, date),
			description = COALESCE($6, description),
			updated_at  = NOW()
		WHERE id = $1
		RETURNING id, title, amount, source, date, description, created_at, updated_at
	`
	inc := &domain.Income{}
	err := r.db.QueryRow(ctx, query,
		id, input.Title, input.Amount, input.Source, input.Date, input.Description,
	).Scan(&inc.ID, &inc.Title, &inc.Amount, &inc.Source, &inc.Date, &inc.Description, &inc.CreatedAt, &inc.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("update income: %w", err)
	}
	return inc, nil
}

func (r *incomeRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM incomes WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete income: %w", err)
	}
	return nil
}