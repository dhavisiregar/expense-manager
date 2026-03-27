-- Migration: 005_multi_user_rls.sql
-- Run in your Supabase SQL Editor AFTER 001-004

-- ── 1. Add user_id column to all tables ──────────────────────
ALTER TABLE expenses  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE incomes   ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ── 2. Enable Row Level Security ─────────────────────────────
ALTER TABLE expenses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- ── 3. Drop old policies if re-running ───────────────────────
DROP POLICY IF EXISTS expenses_user_policy   ON expenses;
DROP POLICY IF EXISTS incomes_user_policy    ON incomes;
DROP POLICY IF EXISTS categories_user_policy ON categories;

-- ── 4. Create per-user RLS policies ──────────────────────────
-- Each user can only see and modify their own rows.
-- auth.uid() is the Supabase built-in that returns the JWT sub.

CREATE POLICY expenses_user_policy ON expenses
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY incomes_user_policy ON incomes
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY categories_user_policy ON categories
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── 5. Update indexes to include user_id ─────────────────────
CREATE INDEX IF NOT EXISTS idx_expenses_user_id  ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_user_id   ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- ── 6. Seed default categories per user is done via API ──────
-- Remove the old global seed rows (they have no user_id so RLS hides them anyway)
-- Users get their own default categories on first login via the app.
