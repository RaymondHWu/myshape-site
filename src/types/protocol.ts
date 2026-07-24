// ============================================================
// MyShape Protocol — Wire Format Types v2.0
//
// CPS-0001 ContinuityReceipt is the canonical protocol object.
// ============================================================

import type { ContinuityReceipt } from "@/lib/evidence/cps0001";

// ── §9.2 — Presence Transaction (legacy, @deprecated) ──

/** @deprecated Use ContinuityReceipt directly. Kept for backward compat with existing tests. */
export interface PresenceTransaction {
  version: 1;
  receipt: ContinuityReceipt;
  entropy_score: number;
  timestamp: number;
  device_salt_hash: string;
  signature: string;
}

// ── §9.5 — Presence Receipt (application-facing, @deprecated) ──

/** @deprecated Use ContinuityReceipt directly. */
export interface PresenceReceipt {
  version: 1;
  presence: true;
  entropy_score: number;
  timestamp: number;
  verification_signature: string;
}

// ── §9.4 — Verification Rules ──

export interface VerificationRules {
  schema_valid: boolean;
  assertions_consistent: boolean;
  temporal_valid: boolean;
  evidence_intact: boolean;
  fresh: boolean;
  replay_protection: boolean;
  device_not_revoked: boolean;
}

// ── §9.7 — Protocol Version ──

export const PROTOCOL_VERSION = "2.0.0" as const;

export interface ProtocolVersion {
  major: number;
  minor: number;
  patch: number;
}

export function parseProtocolVersion(v: string): ProtocolVersion {
  const [major, minor, patch] = v.split(".").map(Number);
  return { major, minor, patch };
}

export function isCompatible(a: ProtocolVersion, b: ProtocolVersion): boolean {
  return a.major === b.major;
}

// ── §9.8 — Capability negotiation ──

export interface ProtocolCapabilities {
  version: string;
  proof_types: string[];
  hash_algorithms: string[];
  max_window_seconds: number;
  min_fps: number;
  supports_aggregation: boolean;
  supports_recursive_proofs: boolean;
}
