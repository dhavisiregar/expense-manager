package repository

import (
	"context"
	"fmt"

	"github.com/dhavisiregar/expense-manager/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type categoryRepo struct {
	db *pgxpool.Pool
}

func NewCategoryRepository(db *pgxpool.Pool) domain.CategoryRepository {
	return &categoryRepo{db: db}
}

func (r *categoryRepo) Create(ctx context.Context, input domain.CreateCategoryInput) (*domain.Category, error) {
	query := `
		INSERT INTO categories (id, name, color, icon, created_at, updated_at)
		VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
		RETURNING id, name, color, icon, created_at, updated_at
	`
	cat := &domain.Category{}
	err := r.db.QueryRow(ctx, query, input.Name, input.Color, input.Icon).
		Scan(&cat.ID, &cat.Name, &cat.Color, &cat.Icon, &cat.CreatedAt, &cat.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("create category: %w", err)
	}
	return cat, nil
}

func (r *categoryRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Category, error) {
	query := `SELECT id, name, color, icon, created_at, updated_at FROM categories WHERE id = $1`
	cat := &domain.Category{}
	err := r.db.QueryRow(ctx, query, id).
		Scan(&cat.ID, &cat.Name, &cat.Color, &cat.Icon, &cat.CreatedAt, &cat.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("get category by id: %w", err)
	}
	return cat, nil
}

func (r *categoryRepo) List(ctx context.Context) ([]domain.Category, error) {
	query := `SELECT id, name, color, icon, created_at, updated_at FROM categories ORDER BY name ASC`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list categories: %w", err)
	}
	defer rows.Close()

	var categories []domain.Category
	for rows.Next() {
		var cat domain.Category
		if err := rows.Scan(&cat.ID, &cat.Name, &cat.Color, &cat.Icon, &cat.CreatedAt, &cat.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan category: %w", err)
		}
		categories = append(categories, cat)
	}
	return categories, nil
}

func (r *categoryRepo) Update(ctx context.Context, id uuid.UUID, input domain.UpdateCategoryInput) (*domain.Category, error) {
	query := `
		UPDATE categories SET
			name = COALESCE($2, name),
			color = COALESCE($3, color),
			icon = COALESCE($4, icon),
			updated_at = NOW()
		WHERE id = $1
		RETURNING id, name, color, icon, created_at, updated_at
	`
	cat := &domain.Category{}
	err := r.db.QueryRow(ctx, query, id, input.Name, input.Color, input.Icon).
		Scan(&cat.ID, &cat.Name, &cat.Color, &cat.Icon, &cat.CreatedAt, &cat.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("update category: %w", err)
	}
	return cat, nil
}

func (r *categoryRepo) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, `DELETE FROM categories WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete category: %w", err)
	}
	return nil
}