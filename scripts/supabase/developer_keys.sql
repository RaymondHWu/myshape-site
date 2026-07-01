-- ============================================================
-- MyShape Protocol — Developer Node Registry
-- ============================================================
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Main table: one row per developer/institution node
CREATE TABLE IF NOT EXISTS developer_keys (
  email          TEXT NOT NULL,
  api_key        TEXT PRIMARY KEY,
  status         TEXT NOT NULL DEFAULT 'ACTIVE',
  request_count  BIGINT NOT NULL DEFAULT 0,
  sdk_version    TEXT DEFAULT 'unknown',
  origin_domain  TEXT DEFAULT 'direct',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_dev_keys_email   ON developer_keys(email);
CREATE INDEX IF NOT EXISTS idx_dev_keys_status  ON developer_keys(status);
CREATE INDEX IF NOT EXISTS idx_dev_keys_created ON developer_keys(created_at);
CREATE INDEX IF NOT EXISTS idx_dev_keys_domain  ON developer_keys(origin_domain);

ALTER TABLE developer_keys ENABLE ROW LEVEL SECURITY;


-- 2. Summary table: auto-updated by trigger, millisecond queries
CREATE TABLE IF NOT EXISTS node_statistics (
  id              INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  total_nodes     BIGINT NOT NULL DEFAULT 0,
  today_nodes     BIGINT NOT NULL DEFAULT 0,
  active_last_7d  BIGINT NOT NULL DEFAULT 0,
  total_requests  BIGINT NOT NULL DEFAULT 0,
  domain_counts   JSONB NOT NULL DEFAULT '{}',
  sdk_counts      JSONB NOT NULL DEFAULT '{}',
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the single summary row
INSERT INTO node_statistics (id, total_nodes, today_nodes, active_last_7d, total_requests)
VALUES (1, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;


-- 3. Trigger function: recalculate summary on every insert
CREATE OR REPLACE FUNCTION refresh_node_statistics()
RETURNS TRIGGER AS $$
DECLARE
  today_str TEXT;
  week_ago  TIMESTAMPTZ;
BEGIN
  today_str := to_char(NOW(), 'YYYY-MM-DD');
  week_ago  := NOW() - INTERVAL '7 days';

  UPDATE node_statistics SET
    total_nodes    = (SELECT COUNT(*) FROM developer_keys WHERE status = 'ACTIVE'),
    today_nodes    = (SELECT COUNT(*) FROM developer_keys WHERE status = 'ACTIVE' AND created_at::date = today_str::date),
    active_last_7d = (SELECT COUNT(*) FROM developer_keys WHERE status = 'ACTIVE' AND last_used_at >= week_ago),
    total_requests = COALESCE((SELECT SUM(request_count) FROM developer_keys), 0),
    domain_counts  = (
      SELECT COALESCE(jsonb_object_agg(origin_domain, cnt), '{}')
      FROM (SELECT origin_domain, COUNT(*) AS cnt FROM developer_keys GROUP BY origin_domain) sub
    ),
    sdk_counts     = (
      SELECT COALESCE(jsonb_object_agg(sdk_version, cnt), '{}')
      FROM (SELECT sdk_version, COUNT(*) AS cnt FROM developer_keys GROUP BY sdk_version) sub
    ),
    updated_at     = NOW()
  WHERE id = 1;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- 4. Attach trigger
DROP TRIGGER IF EXISTS trg_node_statistics ON developer_keys;
CREATE TRIGGER trg_node_statistics
  AFTER INSERT OR UPDATE OR DELETE ON developer_keys
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_node_statistics();
