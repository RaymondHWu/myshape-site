import { describe, it, expect, beforeEach } from "vitest";
import {
  verifyPresenceTransaction,
  revokeDevice,
  createPresenceTransaction,
} from "./protocol-validator";
import { buildReceipt, computePayloadDigest, signReceipt, type ContinuityReceipt } from "@/lib/evidence/cps0001";
import { sha256Hex } from "@/lib/hash";
import { generateKeyPair, createIssuerIdentity } from "@/lib/crypto";

// ── Helpers ──

const TEST_KEYPAIR = generateKeyPair();
const TEST_ISSUER = createIssuerIdentity(TEST_KEYPAIR);

function makeReceipt(overrides: Partial<Omit<ContinuityReceipt, "signature">> = {}): ContinuityReceipt {
  const now = new Date();
  const start = new Date(now.getTime() - 1000);
  const payload = { entropy: 0.75 };

  const unsigned = buildReceipt({
    evidence: [{
      engineId: "EE-001",
      engineVersion: "1.0.0",
      confidence: 0.75,
      payload,
      payloadDigest: computePayloadDigest(payload),
    }],
    interval: {
      start: start.toISOString(),
      end: now.toISOString(),
      coverageMs: 1000,
    },
    subject: { id: sha256Hex("test-device-salt"), type: "embodied" },
    issuer: TEST_ISSUER,
  });

  // Apply overrides AFTER buildReceipt (which hard-codes e.g. protocolVersion)
  const tampered = { ...unsigned, ...overrides };
  return signReceipt(tampered, TEST_KEYPAIR.secretKey);
}

beforeEach(() => {
  // Clean replay registry between tests (no public reset API, so create fresh receipts)
});

// ── verifyPresenceTransaction ──

describe("verifyPresenceTransaction", () => {
  it("passes a valid receipt", () => {
    const receipt = makeReceipt();
    const report = verifyPresenceTransaction(receipt);
    expect(report.passed).toBe(true);
    expect(report.failed_rules).toHaveLength(0);
    expect(report.verified_at).toBeGreaterThan(0);
  });

  it("fails on low confidence (entropy threshold)", () => {
    const receipt = makeReceipt();
    // Override evidence with low confidence
    receipt.evidence[0].confidence = 0.10;
    const report = verifyPresenceTransaction(receipt, { pes_min: 0.65 });
    expect(report.passed).toBe(false);
    expect(report.rules.fresh).toBe(false); // confidence < pes_min
  });

  it("fails on expired receipt", () => {
    const past = new Date(Date.now() - 600_000); // 10 minutes ago
    const pastStart = new Date(past.getTime() - 1000);
    const receipt = makeReceipt({
      interval: {
        start: pastStart.toISOString(),
        end: past.toISOString(),
        coverageMs: 1000,
      },
    });
    const report = verifyPresenceTransaction(receipt, { max_age_seconds: 300 });
    expect(report.passed).toBe(false);
    expect(report.failed_rules).toContain("temporal_valid");
  });

  it("fails on schema violation", () => {
    const receipt = makeReceipt({ protocolVersion: "0.5" } as Partial<ContinuityReceipt>);
    const report = verifyPresenceTransaction(receipt);
    expect(report.passed).toBe(false);
    expect(report.rules.schema_valid).toBe(false);
  });

  it("fails on revoked device", () => {
    revokeDevice(sha256Hex("test-device-salt"));
    const receipt = makeReceipt();
    const report = verifyPresenceTransaction(receipt);
    expect(report.passed).toBe(false);
    expect(report.failed_rules).toContain("device_not_revoked");
  });

  it("respects custom PES minimum", () => {
    const receipt = makeReceipt();
    receipt.evidence[0].confidence = 0.70;
    const report = verifyPresenceTransaction(receipt, { pes_min: 0.85 });
    expect(report.passed).toBe(false);
  });

  it("returns all rule results in the report", () => {
    const receipt = makeReceipt();
    const report = verifyPresenceTransaction(receipt);
    expect(report.rules.schema_valid).toBeDefined();
    expect(report.rules.assertions_consistent).toBeDefined();
    expect(report.rules.temporal_valid).toBeDefined();
    expect(report.rules.evidence_intact).toBeDefined();
    expect(report.rules.fresh).toBeDefined();
    expect(report.rules.replay_protection).toBeDefined();
    expect(report.rules.device_not_revoked).toBeDefined();
  });
});

// ── createPresenceTransaction ──

describe("createPresenceTransaction", () => {
  it("creates a transaction from receipt + confidence + salt", () => {
    const receipt = makeReceipt();
    const tx = createPresenceTransaction(receipt, 0.75, "my-salt");
    expect(tx.version).toBe(1);
    expect(tx.entropy_score).toBe(0.75);
    expect(tx.receipt).toBe(receipt);
    expect(tx.device_salt_hash).toBeTruthy();
    expect(tx.signature).toBeTruthy();
  });
});
