// ============================================================
// MyShape Protocol — Shared Hash Utilities
//
// Single-source-of-truth for all hash operations.
// Previously, the same DJB2-style "quickHash" was copy-pasted
// across 8 files. This module replaces all of them with
// @noble/hashes SHA-256 (already a project dependency).
// ============================================================

import { sha256 as nobleSha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

/** Full SHA-256 hex digest (64 chars). Use for proofs, signatures, verification. */
export function sha256Hex(data: string): string {
  return bytesToHex(nobleSha256(new TextEncoder().encode(data)));
}

/**
 * Short SHA-256 fingerprint (first 8 hex chars = 32 bits).
 *
 * Suitable for display-only IDs and non-security-critical labels.
 * For anything that crosses a trust boundary (proofs, signatures,
 * root hashes in aggregated proofs), use {@link sha256Hex} instead.
 *
 * Note: 32-bit truncation means ~65k unique inputs before a 50%
 * collision probability (birthday bound). This is NOT cryptographic.
 */
export function shortFingerprint(data: string): string {
  return sha256Hex(data).slice(0, 8);
}
