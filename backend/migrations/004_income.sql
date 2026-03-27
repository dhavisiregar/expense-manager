-- Migration: 004_income.sql
-- Run in your Supabase SQL Editor

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
