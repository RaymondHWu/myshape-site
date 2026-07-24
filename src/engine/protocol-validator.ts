// ============================================================
// MyShape Protocol — Protocol Validator
//
// Applies verification rules to CPS-0001 ContinuityReceipts.
// Built on verifyReceipt() (V₁-V₆) with additional checks:
//   - Replay protection (pop_hash / receipt registry)
//   - Device revocation
//   - Entropy threshold
//   - Timestamp freshness
// ============================================================

import { verifyReceipt, type ContinuityReceipt, type VerificationResult as CpsResult } from "@/lib/evidence/cps0001";
import { sha256Hex } from "@/lib/hash";

// ── In-memory registries (production: Supabase — see supabase/migrations/20260724_replay_registry.sql) ──

const replayRegistry = new Set<string>();
const deviceRevocationList = new Set<string>();

// ── Verification rules (same structure as legacy for backward compat) ──

export interface VerificationRules {
  schema_valid: boolean;
  assertions_consistent: boolean;
  temporal_valid: boolean;
  evidence_intact: boolean;
  fresh: boolean;
  replay_protection: boolean;
  device_not_revoked: boolean;
}

export interface VerificationReport {
  passed: boolean;
  rules: VerificationRules;
  failed_rules: string[];
  verified_at: number;
}

// ── Replay Protection ──

/**
 * Check and register a receipt for replay protection.
 * Uses receiptId as the unique key (receiptId is UUIDv7 — unique per proof).
 */
function checkReplay(receipt: ContinuityReceipt): boolean {
  const key = `receipt:${receipt.receiptId}`;
  if (replayRegistry.has(key)) return false;
  replayRegistry.add(key);

  // Clean old entries periodically
  if (replayRegistry.size > 3000) {
    const entries = Array.from(replayRegistry);
    entries.slice(0, 1000).forEach((k) => replayRegistry.delete(k));
  }
  return true;
}

// ── Device Revocation ──

export function revokeDevice(subjectId: string): void {
  deviceRevocationList.add(subjectId);
}

function checkDeviceRevocation(receipt: ContinuityReceipt): boolean {
  return !deviceRevocationList.has(receipt.subject.id);
}

// ── Full Verification ──

/**
 * Verify a CPS-0001 ContinuityReceipt.
 *
 * Applies:
 *   1. CPS-0001 schema + assertions + temporal + evidence + freshness
 *   2. Replay protection (receiptId not previously seen)
 *   3. Device revocation check
 *   4. Entropy threshold
 *   5. Timestamp freshness
 */
export function verifyPresenceTransaction(
  receipt: ContinuityReceipt,
  options: { pes_min?: number; max_age_seconds?: number } = {},
): VerificationReport {
  const { pes_min = 0.20, max_age_seconds = 300 } = options;
  const now = Math.floor(Date.now() / 1000);

  // Run CPS-0001 verification (V₁, V₃, V₄, V₅, V₆)
  const cpsResult: CpsResult = verifyReceipt(receipt);
  const cpsValid = cpsResult.status === "VALID";

  // Extract confidence from first evidence block
  const confidence = receipt.evidence[0]?.confidence ?? 0;

  // Build rules
  const rules: VerificationRules = {
    schema_valid: cpsValid,
    assertions_consistent: cpsValid,
    temporal_valid: cpsValid,
    evidence_intact: cpsValid,
    fresh: cpsValid,
    replay_protection: checkReplay(receipt),
    device_not_revoked: checkDeviceRevocation(receipt),
  };

  // Additional checks beyond CPS-0001
  if (confidence < pes_min) {
    rules.fresh = false; // re-use fresh flag for entropy threshold
  }
  const receiptTime = new Date(receipt.interval.end).getTime() / 1000;
  if (now - receiptTime > max_age_seconds) {
    rules.temporal_valid = false;
  }

  const failed = Object.entries(rules)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  return {
    passed: failed.length === 0,
    rules,
    failed_rules: failed,
    verified_at: now,
  };
}

// ── Create a ContinuityReceipt-based transaction (stub signature) ──

/**
 * Wrap a ContinuityReceipt with an additional device hash and signature.
 *
 * @deprecated The ContinuityReceipt is self-contained. This wrapper exists
 * only for backward compatibility with the legacy PresenceTransaction format.
 * New code should use ContinuityReceipt directly.
 */
export function createPresenceTransaction(
  receipt: ContinuityReceipt,
  confidence: number,
  deviceSalt: string,
): {
  version: 1;
  receipt: ContinuityReceipt;
  entropy_score: number;
  timestamp: number;
  device_salt_hash: string;
  signature: string;
} {
  const deviceHash = sha256Hex(deviceSalt);
  const signData = `${receipt.receiptId}:${confidence}:${receipt.interval.end}:${deviceHash}`;
  const signature = sha256Hex(signData);

  return {
    version: 1,
    receipt,
    entropy_score: confidence,
    timestamp: Math.floor(new Date(receipt.interval.end).getTime() / 1000),
    device_salt_hash: deviceHash,
    signature,
  };
}
