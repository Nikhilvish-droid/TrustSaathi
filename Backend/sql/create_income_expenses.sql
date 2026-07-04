-- Run this in Supabase → SQL Editor (once per project)
-- Creates income_expenses table scoped to organization + user

CREATE TABLE IF NOT EXISTS income_expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  type            TEXT NOT NULL CHECK (type IN ('Income', 'Expense')),
  category        TEXT NOT NULL,
  note            TEXT,
  amount          NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  date            DATE NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_income_expenses_org_date
  ON income_expenses (organization_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_income_expenses_org_type
  ON income_expenses (organization_id, type);

-- Keep updated_at in sync on edits (optional but useful later)
CREATE OR REPLACE FUNCTION set_income_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_income_expenses_updated_at ON income_expenses;
CREATE TRIGGER trg_income_expenses_updated_at
  BEFORE UPDATE ON income_expenses
  FOR EACH ROW
  EXECUTE FUNCTION set_income_expenses_updated_at();

-- RLS is optional. TrustSaathi backend uses pg + JWT and scopes every query by organization_id
-- (same pattern as donations). Skip the block below unless you also query this table from the
-- Supabase client in the browser with the user's session.

-- ALTER TABLE income_expenses ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "income_expenses_select_own_org" ON income_expenses FOR SELECT
--   USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
-- CREATE POLICY "income_expenses_insert_own_org" ON income_expenses FOR INSERT
--   WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
-- CREATE POLICY "income_expenses_update_own_org" ON income_expenses FOR UPDATE
--   USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
-- CREATE POLICY "income_expenses_delete_own_org" ON income_expenses FOR DELETE
--   USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
