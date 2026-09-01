-- Migration: 008_budget_planning.sql
-- Run this in your Neon SQL Editor AFTER 001-007
--
-- Budget Planning
-- One budget = one limit for a category, in a given month/year, per user.

CREATE TABLE IF NOT EXISTS budgets (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              TEXT NOT NULL,
    category_id          UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month                SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year                 SMALLINT NOT NULL CHECK (year >= 2000),
    limit_amount         NUMERIC(14, 2) NOT NULL CHECK (limit_amount > 0),
    alert_threshold_pct  SMALLINT NOT NULL DEFAULT 80 CHECK (alert_threshold_pct BETWEEN 1 AND 100),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, category_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON budgets (user_id, year, month);

CREATE OR REPLACE TRIGGER budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
