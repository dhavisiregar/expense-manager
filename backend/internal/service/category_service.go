package service

import (
	"context"
	"fmt"

	"github.com/dhavisiregar/expense-manager/internal/domain"
	"github.com/google/uuid"
)

type CategoryService struct {
	repo domain.CategoryRepository
}

func NewCategoryService(repo domain.CategoryRepository) *CategoryService {
	return &CategoryService{repo: repo}
}

func (s *CategoryService) Create(ctx context.Context, input domain.CreateCategoryInput) (*domain.Category, error) {
	if input.Name == "" {
		return nil, fmt.Errorf("name is required")
	}
	if input.Color == "" {
		input.Color = "#6366f1"
	}
	if input.Icon == "" {
		input.Icon = "tag"
	}
	return s.repo.Create(ctx, input)
}

func (s *CategoryService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Category, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *CategoryService) List(ctx context.Context) ([]domain.Category, error) {
	return s.repo.List(ctx)
}

func (s *CategoryService) Update(ctx context.Context, id uuid.UUID, input domain.UpdateCategoryInput) (*domain.Category, error) {
	if input.Name != nil && *input.Name == "" {
		return nil, fmt.Errorf("name cannot be empty")
	}
	return s.repo.Update(ctx, id, input)
}

func (s *CategoryService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}