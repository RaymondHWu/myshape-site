-- developer_keys — API key registration for developers/institutions
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS developer_keys (
  email       TEXT NOT NULL,
  api_key     TEXT PRIMARY KEY,
  status      TEXT NOT NULL DEFAULT 'active',
  request_count BIGINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dev_keys_email ON developer_keys(email);
CREATE INDEX IF NOT EXISTS idx_dev_keys_status ON developer_keys(status);
CREATE INDEX IF NOT EXISTS idx_dev_keys_created ON developer_keys(created_at);

-- Row-level security: service role only (API key is secret)
ALTER TABLE developer_keys ENABLE ROW LEVEL SECURITY;
