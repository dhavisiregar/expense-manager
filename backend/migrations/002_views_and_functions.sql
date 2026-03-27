-- Migration: 002_views_and_functions.sql
-- Run after 001_initial_schema.sql

-- ── Monthly summary view ──────────────────────────────────────
CREATE OR REPLACE VIEW monthly_expense_summary AS
SELECT
    DATE_TRUNC('month', date)::date          AS month,
    category_id,
    COUNT(*)                                 AS expense_count,
    SUM(amount)                              AS total_amount,
    AVG(amount)                              AS avg_amount,
    MIN(amount)                              AS min_amount,
    MAX(amount)                              AS max_amount
FROM expenses
GROUP BY DATE_TRUNC('month', date), category_id;

-- ── Category totals view ──────────────────────────────────────
CREATE OR REPLACE VIEW category_totals AS
SELECT
    c.id,
    c.name,
    c.color,
    c.icon,
    COUNT(e.id)           AS expense_count,
    COALESCE(SUM(e.amount), 0) AS total_amount
FROM categories c
LEFT JOIN expenses e ON e.category_id = c.id
GROUP BY c.id, c.name, c.color, c.icon;

-- ── updated_at trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Full-text search index on expenses ───────────────────────
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_expenses_search ON expenses USING GIN(search_vector);

-- ── Tag index ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_expenses_tags ON expenses USING GIN(tags);
