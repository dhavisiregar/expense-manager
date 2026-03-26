package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/dhavisiregar/expense-manager/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type expenseRepo struct {
	db *pgxpool.Pool
}

func NewExpenseRepository(db *pgxpool.Pool) domain.ExpenseRepository {
	return &expenseRepo{db: db}
}

func (r *expenseRepo) Create(ctx context.Context, input domain.CreateExpenseInput) (*domain.Expense, error) {
	query := `
		INSERT INTO expenses (id, title, amount, category_id, tags, date, description, created_at, updated_at)
		VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
		RETURNING id, title, amount, category_id, tags, date, description, created_at, updated_at
	`
	exp := &domain.Expense{}
	err := r.db.QueryRow(ctx, query,
		input.Title, input.Amount, input.CategoryID, input.Tags, input.Date, input.Description,
	).Scan(
		&exp.ID, &exp.Title, &exp.Amount, &exp.CategoryID, &exp.Tags,
		&exp.Date, &exp.Description, &exp.CreatedAt, &exp.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("create expense: %w", err)
	}

	cat, err := r.getCategoryByID(ctx, exp.CategoryID)
	if err == nil {
		exp.Category = cat
	}

	return exp, nil
}

func (r *expenseRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Expense, error) {
	query := `
		SELECT e.id, e.title, e.amount, e.category_id, e.tags, e.date, e.description, e.created_at, e.updated_at,
		       c.id, c.name, c.color, c.icon
		FROM expenses e
		LEFT JOIN categories c ON c.id = e.category_id
		WHERE e.id = $1
	`
	exp := &domain.Expense{Category: &domain.Category{}}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&exp.ID, &exp.Title, &exp.Amount, &exp.CategoryID, &exp.Tags,
		&exp.Date, &exp.Description, &exp.CreatedAt, &exp.UpdatedAt,
		&exp.Category.ID, &exp.Category.Name, &exp.Category.Color, &exp.Category.Icon,
	)
	if err != nil {
		return nil, fmt.Errorf("get expense by id: %w", err)
	}
	return exp, nil
}

func (r *expenseRepo) List(ctx context.Context, filter domain.ExpenseFilter) ([]domain.Expense, int, error) {
	args := []interface{}{}
	argN := 1
	conditions := []string{}

	if filter.CategoryID != nil {
		conditions = append(conditions, fmt.Sprintf("e.category_id = $%d", argN))
		args = append(args, *filter.CategoryID)
		argN++
	}
	if filter.StartDate != nil {
		conditions = append(conditions, fmt.Sprintf("e.date >= $%d", argN))
		args = append(args, *filter.StartDate)
		argN++
	}
	if filter.EndDate != nil {
		conditions = append(conditions, fmt.Sprintf("e.date <= $%d", argN))
		args = append(args, *filter.EndDate)
		argN++
	}

	where := ""
	if len(conditions) > 0 {
		where = "WHERE " + strings.Join(conditions, " AND ")
	}

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM expenses e %s`, where)
	var total int
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count expenses: %w", err)
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
		SELECT e.id, e.title, e.amount, e.category_id, e.tags, e.date, e.description, e.created_at, e.updated_at,
		       c.id, c.name, c.color, c.icon
		FROM expenses e
		LEFT JOIN categories c ON c.id = e.category_id
		%s
		ORDER BY e.date DESC, e.created_at DESC
		LIMIT $%d OFFSET $%d
	`, where, argN, argN+1)
	args = append(args, pageSize, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list expenses: %w", err)
	}
	defer rows.Close()

	var expenses []domain.Expense
	for rows.Next() {
		var exp domain.Expense
		exp.Category = &domain.Category{}
		if err := rows.Scan(
			&exp.ID, &exp.Title, &exp.Amount, &exp.CategoryID, &exp.Tags,
			&exp.Date, &exp.Description, &exp.CreatedAt, &exp.UpdatedAt,
			&exp.Category.ID, &exp.Category.Name, &exp.Category.Color, &exp.Category.Icon,
		); err != nil {
			return nil, 0, fmt.Errorf("scan expense: %w", err)
		}
		expenses = append(expenses, exp)
	}

	return expenses, total, nil
}

func (r *expenseRepo) Update(ctx context.Context, id uuid.UUID, input domain.UpdateExpenseInput) (*domain.Expense, error) {
	query := `
		UPDATE expenses SET
			title = COALESCE($2, title),
			amount = COALESCE($3, amount),
			category_id = COALESCE($4, category_id),
			tags = COALESCE($5, tags),
			date = COALESCE($6, date),
			description = COALESCE($7, description),
			updated_at = NOW()
		WHERE id = $1
		RETURNING id, title, amount, category_id, tags, date, description, created_at, updated_at
	`
	exp := &domain.Expense{}
	err := r.db.QueryRow(ctx, query,
		id, input.Title, input.Amount, input.CategoryID, input.Tags, input.Date, input.Description,
	).Scan(
		&exp.ID, &exp.Title, &exp.Amount, &exp.CategoryID, &exp.Tags,
		&exp.Date, &exp.Description, &exp.CreatedAt, &exp.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("update expense: %w", err)
	}

	cat, err := r.getCategoryByID(ctx, exp.CategoryID)
	if err == nil {
		exp.Category = cat
	}

	return exp, nil
}

func (r *expenseRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM expenses WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete expense: %w", err)
	}
	return nil
}

func (r *expenseRepo) GetDashboardSummary(ctx context.Context) (*domain.DashboardSummary, error) {
	summary := &domain.DashboardSummary{}

	// Total expenses all time
	r.db.QueryRow(ctx, `SELECT COALESCE(SUM(amount), 0), COUNT(*) FROM expenses`).
		Scan(&summary.TotalExpenses, &summary.ExpenseCount)

	// This month expenses
	r.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(amount), 0) FROM expenses
		WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', NOW())
	`).Scan(&summary.MonthlyExpenses)

	// Total income all time
	r.db.QueryRow(ctx, `SELECT COALESCE(SUM(amount), 0) FROM incomes`).
		Scan(&summary.TotalIncome)

	// This month income
	r.db.QueryRow(ctx, `
		SELECT COALESCE(SUM(amount), 0) FROM incomes
		WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', NOW())
	`).Scan(&summary.MonthlyIncome)

	// Balances
	summary.Balance = summary.TotalIncome - summary.TotalExpenses
	summary.MonthlyBalance = summary.MonthlyIncome - summary.MonthlyExpenses

	// By category
	rows, err := r.db.Query(ctx, `
		SELECT c.id, c.name, c.color, c.icon,
		       SUM(e.amount) as total, COUNT(e.id) as count
		FROM expenses e
		JOIN categories c ON c.id = e.category_id
		GROUP BY c.id, c.name, c.color, c.icon
		ORDER BY total DESC
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var cs domain.CategorySummary
			cs.Category = &domain.Category{}
			rows.Scan(&cs.Category.ID, &cs.Category.Name, &cs.Category.Color, &cs.Category.Icon, &cs.Total, &cs.Count)
			summary.ByCategory = append(summary.ByCategory, cs)
		}
		for i := range summary.ByCategory {
			if summary.TotalExpenses > 0 {
				summary.ByCategory[i].Percent = (summary.ByCategory[i].Total / summary.TotalExpenses) * 100
			}
		}
	}

	// Monthly trend (last 6 months) — expenses + income
	trendRows, err := r.db.Query(ctx, `
		SELECT TO_CHAR(m, 'Mon') as month,
		       EXTRACT(YEAR FROM m)::int as year,
		       COALESCE(e.total, 0) as expenses,
		       COALESCE(i.total, 0) as income
		FROM (
			SELECT DATE_TRUNC('month', generate_series(
				NOW() - INTERVAL '5 months', NOW(), INTERVAL '1 month'
			)) AS m
		) months
		LEFT JOIN (
			SELECT DATE_TRUNC('month', date) as mo, SUM(amount) as total
			FROM expenses GROUP BY mo
		) e ON e.mo = m
		LEFT JOIN (
			SELECT DATE_TRUNC('month', date) as mo, SUM(amount) as total
			FROM incomes GROUP BY mo
		) i ON i.mo = m
		ORDER BY m ASC
	`)
	if err == nil {
		defer trendRows.Close()
		for trendRows.Next() {
			var t domain.MonthlyTrend
			trendRows.Scan(&t.Month, &t.Year, &t.Total, &t.Income)
			summary.MonthlyTrend = append(summary.MonthlyTrend, t)
		}
	}

	// Recent expenses
	recentRows, err := r.db.Query(ctx, `
		SELECT e.id, e.title, e.amount, e.category_id, e.tags, e.date, e.description, e.created_at, e.updated_at,
		       c.id, c.name, c.color, c.icon
		FROM expenses e
		LEFT JOIN categories c ON c.id = e.category_id
		ORDER BY e.date DESC
		LIMIT 5
	`)
	if err == nil {
		defer recentRows.Close()
		for recentRows.Next() {
			var exp domain.Expense
			exp.Category = &domain.Category{}
			recentRows.Scan(
				&exp.ID, &exp.Title, &exp.Amount, &exp.CategoryID, &exp.Tags,
				&exp.Date, &exp.Description, &exp.CreatedAt, &exp.UpdatedAt,
				&exp.Category.ID, &exp.Category.Name, &exp.Category.Color, &exp.Category.Icon,
			)
			summary.RecentExpenses = append(summary.RecentExpenses, exp)
		}
	}

	return summary, nil
}

func (r *expenseRepo) getCategoryByID(ctx context.Context, id uuid.UUID) (*domain.Category, error) {
	cat := &domain.Category{}
	err := r.db.QueryRow(ctx, `SELECT id, name, color, icon FROM categories WHERE id = $1`, id).
		Scan(&cat.ID, &cat.Name, &cat.Color, &cat.Icon)
	return cat, err
}