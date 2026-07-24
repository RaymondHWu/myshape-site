-- ============================================================
-- Replay Prevention Registry + Device Revocation List
--
-- Replaces the in-memory stubs in:
--   src/engine/proof-system.ts    (nonReplay, deviceIntegrity)
--   src/engine/protocol-validator.ts (replayRegistry, deviceRevocationList)
--
-- Production verification path:
--   Verifier node checks pop_hash against this registry before
--   accepting a ZK-Presence proof → prevents proof reuse attacks.
-- ============================================================

-- ── Replay Registry ──
-- Every verified proof's pop_hash is recorded here.
-- A duplicate pop_hash means the same proof is being replayed.

CREATE TABLE IF NOT EXISTS proof_replay_registry (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pop_hash TEXT NOT NULL UNIQUE,           -- H(FV) from PresenceProof
  zkp_hash TEXT NOT NULL,                  -- root hash from ZKPresenceProof
  first_seen_at TIMESTAMPTZ DEFAULT NOW(), -- when this proof was first verified
  verifier_node TEXT                       -- which verifier accepted it (optional)
);

CREATE INDEX IF NOT EXISTS idx_replay_pop_hash ON proof_replay_registry(pop_hash);
CREATE INDEX IF NOT EXISTS idx_replay_first_seen ON proof_replay_registry(first_seen_at);

-- ── Device Revocation List ──
-- device_salt_hash entries for revoked/decommissioned devices.
-- A proof from a revoked device is rejected regardless of PES score.

CREATE TABLE IF NOT EXISTS device_revocation_list (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  device_salt_hash TEXT NOT NULL UNIQUE,   -- H(device_salt)
  revoked_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT,                             -- "user_requested" | "compromised" | "admin"
  revoked_by TEXT                          -- audit trail (admin user or system)
);

CREATE INDEX IF NOT EXISTS idx_revocation_device ON device_revocation_list(device_salt_hash);

-- ── Cleanup function — removes registry entries older than N days ──
-- Proofs naturally expire (by timestamp), so old registry entries are
-- just taking up space. Call this via pg_cron or a scheduled edge function.

CREATE OR REPLACE FUNCTION cleanup_expired_replay_entries(retention_days INT DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM proof_replay_registry
  WHERE first_seen_at < NOW() - (retention_days || ' days')::INTERVAL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ── RLS: only verifier service role can insert/query ──
ALTER TABLE proof_replay_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_revocation_list ENABLE ROW LEVEL SECURITY;

-- Service role bypass (verifier nodes use service_role key, never anon)
CREATE POLICY "service_role_full_access_replay"
  ON proof_replay_registry FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_full_access_revocation"
  ON device_revocation_list FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
