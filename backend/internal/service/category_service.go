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
		input.Icon = "🏷️"
	}
	return s.repo.Create(ctx, input)
}

func (s *CategoryService) GetByID(ctx context.Context, id, userID uuid.UUID) (*domain.Category, error) {
	return s.repo.GetByID(ctx, id, userID)
}

func (s *CategoryService) List(ctx context.Context, userID uuid.UUID) ([]domain.Category, error) {
	return s.repo.List(ctx, userID)
}

func (s *CategoryService) Update(ctx context.Context, id, userID uuid.UUID, input domain.UpdateCategoryInput) (*domain.Category, error) {
	if input.Name != nil && *input.Name == "" {
		return nil, fmt.Errorf("name cannot be empty")
	}
	return s.repo.Update(ctx, id, userID, input)
}

func (s *CategoryService) Delete(ctx context.Context, id, userID uuid.UUID) error {
	return s.repo.Delete(ctx, id, userID)
}

func (s *CategoryService) SeedDefaults(ctx context.Context, userID uuid.UUID) error {
	// Don't seed if user already has categories
	existing, err := s.repo.List(ctx, userID)
	if err == nil && len(existing) > 0 {
		return nil
	}

	defaults := []domain.CreateCategoryInput{
		{UserID: userID, Name: "Food & Dining", Color: "#f59e0b", Icon: "🍔"},
		{UserID: userID, Name: "Transportation", Color: "#3b82f6", Icon: "🚗"},
		{UserID: userID, Name: "Shopping", Color: "#ec4899", Icon: "🛍️"},
		{UserID: userID, Name: "Entertainment", Color: "#8b5cf6", Icon: "🎬"},
		{UserID: userID, Name: "Health & Medical", Color: "#10b981", Icon: "❤️"},
		{UserID: userID, Name: "Housing", Color: "#f97316", Icon: "🏠"},
		{UserID: userID, Name: "Travel", Color: "#06b6d4", Icon: "✈️"},
		{UserID: userID, Name: "Education", Color: "#6366f1", Icon: "📚"},
		{UserID: userID, Name: "Utilities", Color: "#64748b", Icon: "⚡"},
		{UserID: userID, Name: "Other", Color: "#94a3b8", Icon: "📦"},
	}
	for _, d := range defaults {
		if _, err := s.repo.Create(ctx, d); err != nil {
			return err
		}
	}
	return nil
}