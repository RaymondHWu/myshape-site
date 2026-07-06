-- Migration: Genesis Key — unique proof token for Genesis 100 cohort members
-- Each GENESIS_NODE receives a unique, immutable genesis_key upon minting

ALTER TABLE protocol_nodes ADD COLUMN IF NOT EXISTS genesis_key TEXT UNIQUE;

COMMENT ON COLUMN protocol_nodes.genesis_key IS 'Unique Genesis cohort proof token (UUID v4). Set once when GENESIS_NODE is minted. Immutable.';
