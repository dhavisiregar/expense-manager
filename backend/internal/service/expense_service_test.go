package service_test

import (
	"context"
	"testing"
	"time"

	"github.com/dhavisiregar/expense-manager/internal/domain"
	"github.com/dhavisiregar/expense-manager/internal/service"
	"github.com/google/uuid"
)

// ─── Mock Repository ─────────────────────────────────────────

type mockExpenseRepo struct {
	expenses map[uuid.UUID]*domain.Expense
}

func newMockRepo() *mockExpenseRepo {
	return &mockExpenseRepo{expenses: make(map[uuid.UUID]*domain.Expense)}
}

func (m *mockExpenseRepo) Create(ctx context.Context, input domain.CreateExpenseInput) (*domain.Expense, error) {
	exp := &domain.Expense{
		ID:          uuid.New(),
		Title:       input.Title,
		Amount:      input.Amount,
		CategoryID:  input.CategoryID,
		Tags:        input.Tags,
		Date:        input.Date,
		Description: input.Description,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	m.expenses[exp.ID] = exp
	return exp, nil
}

func (m *mockExpenseRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Expense, error) {
	if exp, ok := m.expenses[id]; ok {
		return exp, nil
	}
	return nil, domain.ErrNotFound
}

func (m *mockExpenseRepo) List(ctx context.Context, filter domain.ExpenseFilter) ([]domain.Expense, int, error) {
	var out []domain.Expense
	for _, e := range m.expenses {
		out = append(out, *e)
	}
	return out, len(out), nil
}

func (m *mockExpenseRepo) Update(ctx context.Context, id uuid.UUID, input domain.UpdateExpenseInput) (*domain.Expense, error) {
	exp, ok := m.expenses[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	if input.Title != nil {
		exp.Title = *input.Title
	}
	if input.Amount != nil {
		exp.Amount = *input.Amount
	}
	return exp, nil
}

func (m *mockExpenseRepo) Delete(ctx context.Context, id uuid.UUID) error {
	delete(m.expenses, id)
	return nil
}

func (m *mockExpenseRepo) GetDashboardSummary(ctx context.Context) (*domain.DashboardSummary, error) {
	return &domain.DashboardSummary{}, nil
}

// ─── Tests ───────────────────────────────────────────────────

func TestCreateExpense_Valid(t *testing.T) {
	svc := service.NewExpenseService(newMockRepo())
	input := domain.CreateExpenseInput{
		Title:      "Lunch",
		Amount:     85000,
		CategoryID: uuid.New(),
		Date:       time.Now(),
	}
	exp, err := svc.Create(context.Background(), input)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if exp.Title != "Lunch" {
		t.Errorf("expected title Lunch, got %s", exp.Title)
	}
}

func TestCreateExpense_MissingTitle(t *testing.T) {
	svc := service.NewExpenseService(newMockRepo())
	input := domain.CreateExpenseInput{
		Amount:     85000,
		CategoryID: uuid.New(),
		Date:       time.Now(),
	}
	_, err := svc.Create(context.Background(), input)
	if err == nil {
		t.Fatal("expected error for missing title, got nil")
	}
}

func TestCreateExpense_ZeroAmount(t *testing.T) {
	svc := service.NewExpenseService(newMockRepo())
	input := domain.CreateExpenseInput{
		Title:      "Lunch",
		Amount:     0,
		CategoryID: uuid.New(),
		Date:       time.Now(),
	}
	_, err := svc.Create(context.Background(), input)
	if err == nil {
		t.Fatal("expected error for zero amount, got nil")
	}
}

func TestCreateExpense_NegativeAmount(t *testing.T) {
	svc := service.NewExpenseService(newMockRepo())
	input := domain.CreateExpenseInput{
		Title:      "Refund",
		Amount:     -5000,
		CategoryID: uuid.New(),
		Date:       time.Now(),
	}
	_, err := svc.Create(context.Background(), input)
	if err == nil {
		t.Fatal("expected error for negative amount, got nil")
	}
}

func TestCreateExpense_MissingCategory(t *testing.T) {
	svc := service.NewExpenseService(newMockRepo())
	input := domain.CreateExpenseInput{
		Title:  "Lunch",
		Amount: 85000,
		Date:   time.Now(),
	}
	_, err := svc.Create(context.Background(), input)
	if err == nil {
		t.Fatal("expected error for missing category, got nil")
	}
}

func TestDeleteExpense(t *testing.T) {
	repo := newMockRepo()
	svc := service.NewExpenseService(repo)
	created, _ := svc.Create(context.Background(), domain.CreateExpenseInput{
		Title: "Test", Amount: 1000, CategoryID: uuid.New(), Date: time.Now(),
	})
	if err := svc.Delete(context.Background(), created.ID); err != nil {
		t.Fatalf("expected no error on delete, got %v", err)
	}
	if _, exists := repo.expenses[created.ID]; exists {
		t.Fatal("expense should have been deleted")
	}
}