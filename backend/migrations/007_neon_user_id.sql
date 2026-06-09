-- Migration: 007_neon_user_id.sql
-- Self-contained migration for Neon (no Supabase dependencies)
-- Run this AFTER 001_initial_schema.sql (categories + expenses already exist)

-- ── set_updated_at trigger function (from 002) ────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── incomes table (from 004) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS incomes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    source      TEXT NOT NULL DEFAULT 'Other',
    date        TIMESTAMPTZ NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date DESC);

CREATE OR REPLACE TRIGGER incomes_updated_at
  BEFORE UPDATE ON incomes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Add user_id TEXT columns ──────────────────────────────────
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE expenses   ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE incomes    ADD COLUMN IF NOT EXISTS user_id TEXT;

CREATE INDEX IF NOT EXISTS idx_expenses_user_id   ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_user_id    ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- ── subscriptions table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           TEXT NOT NULL UNIQUE,
    plan              TEXT NOT NULL DEFAULT 'free',
    status            TEXT NOT NULL DEFAULT 'active',
    midtrans_order_id TEXT,
    midtrans_tx_id    TEXT,
    started_at        TIMESTAMPTZ,
    expires_at        TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id  ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_order_id ON subscriptions(midtrans_order_id);
