package service_test

import (
	"context"
	"testing"

	"github.com/dhavisiregar/expense-manager/internal/domain"
	"github.com/dhavisiregar/expense-manager/internal/service"
	"github.com/google/uuid"
)

type mockCategoryRepo struct {
	categories map[uuid.UUID]*domain.Category
}

func newMockCatRepo() *mockCategoryRepo {
	return &mockCategoryRepo{categories: make(map[uuid.UUID]*domain.Category)}
}

func (m *mockCategoryRepo) Create(_ context.Context, input domain.CreateCategoryInput) (*domain.Category, error) {
	cat := &domain.Category{ID: uuid.New(), Name: input.Name, Color: input.Color, Icon: input.Icon}
	m.categories[cat.ID] = cat
	return cat, nil
}
func (m *mockCategoryRepo) GetByID(_ context.Context, id uuid.UUID) (*domain.Category, error) {
	if c, ok := m.categories[id]; ok { return c, nil }
	return nil, domain.ErrNotFound
}
func (m *mockCategoryRepo) List(_ context.Context) ([]domain.Category, error) {
	var out []domain.Category
	for _, c := range m.categories { out = append(out, *c) }
	return out, nil
}
func (m *mockCategoryRepo) Update(_ context.Context, id uuid.UUID, input domain.UpdateCategoryInput) (*domain.Category, error) {
	c, ok := m.categories[id]
	if !ok { return nil, domain.ErrNotFound }
	if input.Name != nil { c.Name = *input.Name }
	return c, nil
}
func (m *mockCategoryRepo) Delete(_ context.Context, id uuid.UUID) error {
	delete(m.categories, id)
	return nil
}

func TestCreateCategory_Valid(t *testing.T) {
	svc := service.NewCategoryService(newMockCatRepo())
	cat, err := svc.Create(context.Background(), domain.CreateCategoryInput{Name: "Food"})
	if err != nil { t.Fatalf("unexpected error: %v", err) }
	if cat.Name != "Food" { t.Errorf("expected name Food, got %s", cat.Name) }
	if cat.Color == "" { t.Error("expected default color") }
	if cat.Icon == "" { t.Error("expected default icon") }
}

func TestCreateCategory_EmptyName(t *testing.T) {
	svc := service.NewCategoryService(newMockCatRepo())
	_, err := svc.Create(context.Background(), domain.CreateCategoryInput{Name: ""})
	if err == nil { t.Fatal("expected error for empty name") }
}

func TestUpdateCategory_EmptyName(t *testing.T) {
	svc := service.NewCategoryService(newMockCatRepo())
	created, _ := svc.Create(context.Background(), domain.CreateCategoryInput{Name: "Transport"})
	empty := ""
	_, err := svc.Update(context.Background(), created.ID, domain.UpdateCategoryInput{Name: &empty})
	if err == nil { t.Fatal("expected error for empty name update") }
}

func TestDeleteCategory(t *testing.T) {
	repo := newMockCatRepo()
	svc := service.NewCategoryService(repo)
	created, _ := svc.Create(context.Background(), domain.CreateCategoryInput{Name: "Shopping"})
	if err := svc.Delete(context.Background(), created.ID); err != nil { t.Fatalf("delete error: %v", err) }
	if _, exists := repo.categories[created.ID]; exists { t.Fatal("should have been deleted") }
}