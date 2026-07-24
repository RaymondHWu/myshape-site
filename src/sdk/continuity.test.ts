import { describe, it, expect } from "vitest";
import { checkContinuity, type ContinuityStatus } from "./continuity";
import { buildReceipt, computePayloadDigest, signReceipt, type ContinuityReceipt } from "@/lib/evidence/cps0001";
import { generateKeyPair, createIssuerIdentity } from "@/lib/crypto";

// ── Helpers ──

const KEYPAIR = generateKeyPair();
const ISSUER = createIssuerIdentity(KEYPAIR);

function makeReceipt(confidence: number, offsetMs: number): ContinuityReceipt {
  const now = Date.now() + offsetMs;
  const start = new Date(now - 1000);
  const end = new Date(now);
  const payload = { entropy: confidence };

  const unsigned = buildReceipt({
    evidence: [{
      engineId: "EE-001",
      engineVersion: "1.0.0",
      confidence,
      payload,
      payloadDigest: computePayloadDigest(payload),
    }],
    interval: {
      start: start.toISOString(),
      end: end.toISOString(),
      coverageMs: 1000,
    },
    subject: { id: "test-subject", type: "embodied" },
    issuer: ISSUER,
  });

  return signReceipt(unsigned, KEYPAIR.secretKey);
}

// ── Tests ──

describe("checkContinuity", () => {
  it("returns null for fewer than 3 receipts", () => {
    expect(checkContinuity([])).toBeNull();
    expect(checkContinuity([makeReceipt(0.8, 0)])).toBeNull();
    expect(checkContinuity([makeReceipt(0.8, 0), makeReceipt(0.8, 1000)])).toBeNull();
  });

  it("returns a valid status for 3+ receipts", () => {
    const receipts = [
      makeReceipt(0.75, 0),
      makeReceipt(0.76, 1000),
      makeReceipt(0.74, 2000),
    ];
    const status = checkContinuity(receipts);
    expect(status).not.toBeNull();
    expect(status!.receiptCount).toBe(3);
    expect(status!.durationSeconds).toBeGreaterThan(0);
    expect(status!.pss).toBeGreaterThan(0);
    expect(status!.pss).toBeLessThanOrEqual(1);
    expect(["rising", "stable", "declining"]).toContain(status!.trend);
  });

  it("high and consistent confidence → high PSS + isContinuous", () => {
    const receipts = [
      makeReceipt(0.90, 0),
      makeReceipt(0.91, 1000),
      makeReceipt(0.89, 2000),
      makeReceipt(0.90, 3000),
    ];
    const status = checkContinuity(receipts)!;
    expect(status.pss).toBeGreaterThan(0.7);
    expect(status.isContinuous).toBe(true);
    expect(status.trend).toBe("stable");
  });

  it("low confidence → low PSS + not continuous", () => {
    const receipts = [
      makeReceipt(0.30, 0),
      makeReceipt(0.25, 1000),
      makeReceipt(0.28, 2000),
    ];
    const status = checkContinuity(receipts)!;
    expect(status.pss).toBeLessThan(0.5);
    expect(status.isContinuous).toBe(false);
  });

  it("detects declining trend", () => {
    const receipts = [
      makeReceipt(0.80, 0),
      makeReceipt(0.70, 1000),
      makeReceipt(0.60, 2000),
      makeReceipt(0.50, 3000),
    ];
    const status = checkContinuity(receipts)!;
    expect(status.trend).toBe("declining");
  });

  it("detects rising trend", () => {
    const receipts = [
      makeReceipt(0.50, 0),
      makeReceipt(0.60, 1000),
      makeReceipt(0.70, 2000),
      makeReceipt(0.80, 3000),
    ];
    const status = checkContinuity(receipts)!;
    expect(status.trend).toBe("rising");
  });

  it("custom minPss option works", () => {
    const receipts = [
      makeReceipt(0.55, 0),
      makeReceipt(0.56, 1000),
      makeReceipt(0.54, 2000),
    ];
    const status = checkContinuity(receipts, { minPss: 0.70 })!;
    expect(status.isContinuous).toBe(false);

    const status2 = checkContinuity(receipts, { minPss: 0.30 })!;
    expect(status2.isContinuous).toBe(true);
  });

  it("custom minReceipts option works", () => {
    const receipts = [
      makeReceipt(0.80, 0),
      makeReceipt(0.81, 1000),
    ];
    expect(checkContinuity(receipts, { minReceipts: 3 })).toBeNull(); // 2 < 3
    expect(checkContinuity(receipts, { minReceipts: 2 })).not.toBeNull(); // 2 >= 2
  });

  it("volatile confidence → lower PSS than stable confidence", () => {
    const stable = [
      makeReceipt(0.70, 0),
      makeReceipt(0.71, 1000),
      makeReceipt(0.69, 2000),
      makeReceipt(0.70, 3000),
    ];
    const volatile = [
      makeReceipt(0.90, 0),
      makeReceipt(0.20, 1000),
      makeReceipt(0.85, 2000),
      makeReceipt(0.15, 3000),
    ];
    const stableStatus = checkContinuity(stable)!;
    const volatileStatus = checkContinuity(volatile)!;

    // Same mean (~0.7 vs ~0.525), but volatile has lower PSS
    expect(stableStatus.pss).toBeGreaterThan(volatileStatus.pss);
  });
});
