package repository

import (
	"context"
	"fmt"
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
		INSERT INTO incomes (id, user_id, title, amount, source, date, description, created_at, updated_at)
		VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
		RETURNING id, user_id, title, amount, source, date, description, created_at, updated_at
	`
	inc := &domain.Income{}
	err := r.db.QueryRow(ctx, query, input.UserID, input.Title, input.Amount, input.Source, input.Date, input.Description).
		Scan(&inc.ID, &inc.UserID, &inc.Title, &inc.Amount, &inc.Source, &inc.Date, &inc.Description, &inc.CreatedAt, &inc.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create income: %w", err)
	}
	return inc, nil
}

func (r *incomeRepo) GetByID(ctx context.Context, id, userID uuid.UUID) (*domain.Income, error) {
	inc := &domain.Income{}
	err := r.db.QueryRow(ctx,
		`SELECT id, user_id, title, amount, source, date, description, created_at, updated_at FROM incomes WHERE id=$1 AND user_id=$2`,
		id, userID,
	).Scan(&inc.ID, &inc.UserID, &inc.Title, &inc.Amount, &inc.Source, &inc.Date, &inc.Description, &inc.CreatedAt, &inc.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("get income: %w", err)
	}
	return inc, nil
}

func (r *incomeRepo) List(ctx context.Context, filter domain.IncomeFilter) ([]domain.Income, int, error) {
	args := []interface{}{filter.UserID}
	argN := 2
	conditions := []string{"user_id = $1"}

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

	where := "WHERE " + strings.Join(conditions, " AND ")

	var total int
	r.db.QueryRow(ctx, fmt.Sprintf("SELECT COUNT(*) FROM incomes %s", where), args...).Scan(&total)

	page := filter.Page
	if page < 1 {
		page = 1
	}
	pageSize := filter.PageSize
	if pageSize < 1 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize

	rows, err := r.db.Query(ctx, fmt.Sprintf(`
		SELECT id, user_id, title, amount, source, date, description, created_at, updated_at
		FROM incomes %s ORDER BY date DESC, created_at DESC LIMIT $%d OFFSET $%d
	`, where, argN, argN+1), append(args, pageSize, offset)...)
	if err != nil {
		return nil, 0, fmt.Errorf("list incomes: %w", err)
	}
	defer rows.Close()

	var incomes []domain.Income
	for rows.Next() {
		var inc domain.Income
		rows.Scan(&inc.ID, &inc.UserID, &inc.Title, &inc.Amount, &inc.Source, &inc.Date, &inc.Description, &inc.CreatedAt, &inc.UpdatedAt)
		incomes = append(incomes, inc)
	}
	return incomes, total, nil
}

func (r *incomeRepo) Update(ctx context.Context, id, userID uuid.UUID, input domain.UpdateIncomeInput) (*domain.Income, error) {
	inc := &domain.Income{}
	err := r.db.QueryRow(ctx, `
		UPDATE incomes SET
			title=$3, amount=COALESCE($4,amount), source=COALESCE($5,source),
			date=COALESCE($6,date), description=COALESCE($7,description), updated_at=NOW()
		WHERE id=$1 AND user_id=$2
		RETURNING id, user_id, title, amount, source, date, description, created_at, updated_at
	`, id, userID, input.Title, input.Amount, input.Source, input.Date, input.Description).
		Scan(&inc.ID, &inc.UserID, &inc.Title, &inc.Amount, &inc.Source, &inc.Date, &inc.Description, &inc.CreatedAt, &inc.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("update income: %w", err)
	}
	return inc, nil
}

func (r *incomeRepo) Delete(ctx context.Context, id, userID uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM incomes WHERE id=$1 AND user_id=$2`, id, userID)
	return err
}