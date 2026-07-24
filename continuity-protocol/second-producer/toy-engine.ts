/**
 * EE-999 — Toy Engine
 *
 * This engine is INTENTIONALLY MEANINGLESS.
 *
 * It takes a challenge string, returns a deterministic confidence score
 * (based on the length and hex content of the challenge), and produces
 * a valid CPS-0001 EvidenceBlock.
 *
 * It has:
 *   - No sensor
 *   - No human data
 *   - No machine learning
 *   - No biometrics
 *   - No real-world meaning whatsoever
 *
 * And yet — it produces a perfectly valid CPS-0001 Receipt that
 * passes all V₁–V₆ checks in the Reference Verifier.
 *
 * This is the point: CPS-0001 does not care what your evidence is.
 *
 * ---
 * Usage:
 *   import { run } from "./toy-engine";
 *   const block = run("hello");
 *   // → { engineId: "EE-999", confidence: 0.81, payload: {...}, payloadDigest: "..." }
 */

import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

export interface ToyEvidence {
  challenge: string;
  length: number;
  hexChars: number;
  timestamp: string;
}

function sha256Hex(data: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(data)));
}

/**
 * Run the Toy Engine on a challenge string.
 *
 * Confidence formula: min(0.95, (hexChars / length) * 1.2)
 * Bias: longer challenges with more hex characters score higher.
 * This is arbitrary and meaningless — by design.
 */
export function run(challenge: string) {
  const hexChars = challenge.replace(/[^0-9a-fA-F]/g, "").length;
  const length = challenge.length || 1;
  const confidence = Math.min(0.95, (hexChars / length) * 1.2);

  const payload: ToyEvidence = {
    challenge,
    length,
    hexChars,
    timestamp: new Date().toISOString(),
  };

  const payloadDigest = sha256Hex(JSON.stringify(payload));

  return {
    engineId: "EE-999",
    engineVersion: "1.0.0",
    confidence,
    payload: payload as unknown as Record<string, unknown>,
    payloadDigest,
  };
}
