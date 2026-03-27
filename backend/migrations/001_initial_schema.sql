-- Migration: 001_initial_schema.sql
-- Run this in your Supabase SQL editor

-- Enable UUID extension (already available in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    color       TEXT NOT NULL DEFAULT '#6366f1',
    icon        TEXT NOT NULL DEFAULT 'tag',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    tags        TEXT[] NOT NULL DEFAULT '{}',
    date        TIMESTAMPTZ NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at DESC);

-- Seed default categories
INSERT INTO categories (name, color, icon) VALUES
    ('Food & Dining',     '#f59e0b', '🍔'),
    ('Transportation',    '#3b82f6', '🚗'),
    ('Shopping',          '#ec4899', '🛍️'),
    ('Entertainment',     '#8b5cf6', '🎬'),
    ('Health & Medical',  '#10b981', '❤️'),
    ('Housing',           '#f97316', '🏠'),
    ('Travel',            '#06b6d4', '✈️'),
    ('Education',         '#6366f1', '📚'),
    ('Utilities',         '#64748b', '⚡'),
    ('Other',             '#94a3b8', '📦')
ON CONFLICT DO NOTHING;
