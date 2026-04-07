package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/dhavisiregar/expense-manager/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SubscriptionRepository interface {
	GetByUserID(ctx context.Context, userID uuid.UUID) (*domain.Subscription, error)
	Upsert(ctx context.Context, sub *domain.Subscription) error
	GetByOrderID(ctx context.Context, orderID string) (*domain.Subscription, error)
	ActivatePro(ctx context.Context, orderID, txID string, expiresAt time.Time) error
}

type subscriptionRepo struct {
	db *pgxpool.Pool
}

func NewSubscriptionRepository(db *pgxpool.Pool) SubscriptionRepository {
	return &subscriptionRepo{db: db}
}

func (r *subscriptionRepo) GetByUserID(ctx context.Context, userID uuid.UUID) (*domain.Subscription, error) {
	sub := &domain.Subscription{}
	err := r.db.QueryRow(ctx, `
		SELECT id, user_id, plan, status, midtrans_order_id, midtrans_tx_id,
		       started_at, expires_at, created_at, updated_at
		FROM subscriptions WHERE user_id = $1
	`, userID).Scan(
		&sub.ID, &sub.UserID, &sub.Plan, &sub.Status,
		&sub.MidtransOrderID, &sub.MidtransTxID,
		&sub.StartedAt, &sub.ExpiresAt, &sub.CreatedAt, &sub.UpdatedAt,
	)
	if err != nil {
		// Auto-create free subscription if not exists
		sub = &domain.Subscription{
			UserID: userID.String(),
			Plan:   "free",
			Status: "active",
		}
		r.db.Exec(ctx, `
			INSERT INTO subscriptions (user_id, plan, status)
			VALUES ($1, 'free', 'active')
			ON CONFLICT (user_id) DO NOTHING
		`, userID)
	}
	return sub, nil
}

func (r *subscriptionRepo) Upsert(ctx context.Context, sub *domain.Subscription) error {
	_, err := r.db.Exec(ctx, `
		INSERT INTO subscriptions (user_id, plan, status, midtrans_order_id, midtrans_tx_id, started_at, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (user_id) DO UPDATE SET
			plan = EXCLUDED.plan,
			status = EXCLUDED.status,
			midtrans_order_id = EXCLUDED.midtrans_order_id,
			midtrans_tx_id = EXCLUDED.midtrans_tx_id,
			started_at = EXCLUDED.started_at,
			expires_at = EXCLUDED.expires_at,
			updated_at = NOW()
	`, sub.UserID, sub.Plan, sub.Status, sub.MidtransOrderID, sub.MidtransTxID, sub.StartedAt, sub.ExpiresAt)
	return err
}

func (r *subscriptionRepo) GetByOrderID(ctx context.Context, orderID string) (*domain.Subscription, error) {
	sub := &domain.Subscription{}
	err := r.db.QueryRow(ctx, `
		SELECT id, user_id, plan, status, midtrans_order_id, midtrans_tx_id,
		       started_at, expires_at, created_at, updated_at
		FROM subscriptions WHERE midtrans_order_id = $1
	`, orderID).Scan(
		&sub.ID, &sub.UserID, &sub.Plan, &sub.Status,
		&sub.MidtransOrderID, &sub.MidtransTxID,
		&sub.StartedAt, &sub.ExpiresAt, &sub.CreatedAt, &sub.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("subscription not found: %w", err)
	}
	return sub, nil
}

func (r *subscriptionRepo) ActivatePro(ctx context.Context, orderID, txID string, expiresAt time.Time) error {
	now := time.Now()
	_, err := r.db.Exec(ctx, `
		UPDATE subscriptions SET
			plan = 'pro',
			status = 'active',
			midtrans_tx_id = $2,
			started_at = $3,
			expires_at = $4,
			updated_at = NOW()
		WHERE midtrans_order_id = $1
	`, orderID, txID, now, expiresAt)
	return err
}