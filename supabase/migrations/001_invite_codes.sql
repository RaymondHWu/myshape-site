-- Migration: Create invite_codes table for beta tester onboarding
-- Run this in Supabase SQL Editor (https://app.supabase.com/project/_/sql)

CREATE TABLE IF NOT EXISTS invite_codes (
  code        TEXT PRIMARY KEY,
  status      TEXT NOT NULL DEFAULT 'UNUSED' CHECK (status IN ('UNUSED', 'USED', 'REVOKED')),
  used_by     TEXT,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookup by status
CREATE INDEX IF NOT EXISTS idx_invite_codes_status ON invite_codes (status);

-- RLS: only service role can read/write (all access via API routes)
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (API routes use SUPABASE_SERVICE_ROLE_KEY)
CREATE POLICY "service_role_full_access" ON invite_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE invite_codes IS 'Beta tester invitation codes — 50 codes for the initial Genesis Cohort beta phase';
COMMENT ON COLUMN invite_codes.status IS 'UNUSED | USED | REVOKED';
COMMENT ON COLUMN invite_codes.used_by IS 'Email of the node that consumed this code';
