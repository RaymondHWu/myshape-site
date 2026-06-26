-- Migration: SIWE Wallet Authentication
-- Adds wallet_address for Sign-In with Ethereum support

ALTER TABLE protocol_nodes ADD COLUMN IF NOT EXISTS wallet_address TEXT UNIQUE;
ALTER TABLE protocol_nodes ADD COLUMN IF NOT EXISTS wallet_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN protocol_nodes.wallet_address IS 'Ethereum address (0x...) bound via EIP-4361 signature';
COMMENT ON COLUMN protocol_nodes.wallet_verified_at IS 'Timestamp of successful SIWE verification';

-- Index for wallet lookup
CREATE INDEX IF NOT EXISTS idx_protocol_nodes_wallet ON protocol_nodes (wallet_address);
