import { describe, it, expect } from "vitest";
import { runContinuityVerification, evaluateTwoStage } from "./verify-continuity";
import { verifyReceipt } from "@/lib/evidence/cps0001";
import type { RoundResult } from "@/lib/evidence/gyro-challenge";
import type { JointPosition } from "@/types/motion-vector";

// ── Synthetic fixtures ──
// Note: these are synthetic test inputs (same convention as
// presence-entropy.test.ts), used only to exercise the composition
// wiring. The TRY demo itself never fabricates data — it feeds real
// MediaPipe/DeviceMotion captures into this function.

function makeMotionFrames(count: number): {
  frames: Array<Record<number, JointPosition>>;
  timestamps: number[];
} {
  const timestamps: number[] = [];
  let t = 0;
  for (let i = 0; i < count; i++) {
    t += 33 + Math.round(Math.random() * 8);
    timestamps.push(t);
  }

  const frames = timestamps.map((_, fi) => {
    const joints: Record<number, JointPosition> = {};
    for (let j = 0; j < 18; j++) {
      joints[j] = {
        x: 320 + Math.sin(fi * 0.3 + j * 0.5) * 15 + Math.random() * 3,
        y: 240 + Math.cos(fi * 0.25 + j * 0.4) * 10 + Math.random() * 3,
        z: Math.sin(fi * 0.2) * 5 + Math.random() * 2,
      };
    }
    return joints;
  });

  return { frames, timestamps };
}

function makePassingRounds(count: number): RoundResult[] {
  return Array.from({ length: count }, (_, i) => ({
    round: i + 1,
    direction: "→" as const,
    jitterMs: 500,
    angleDeg: 120,
    directionMatch: true,
    peakG: 0.45,
    magnitudeStatus: "PASS" as const,
    sampleCount: 60,
  }));
}

function makeNoRotationRounds(count: number): RoundResult[] {
  return Array.from({ length: count }, (_, i) => ({
    round: i + 1,
    direction: "→" as const,
    jitterMs: 500,
    angleDeg: 5,
    directionMatch: false,
    peakG: 0.05,
    magnitudeStatus: "FAIL" as const,
    sampleCount: 60,
  }));
}

function makeWrongDirectionRounds(count: number): RoundResult[] {
  // Sufficient magnitude but wrong sign — the "moved but non-compliant" case.
  return Array.from({ length: count }, (_, i) => ({
    round: i + 1,
    direction: "→" as const,
    jitterMs: 500,
    angleDeg: 120,
    directionMatch: false,
    peakG: 0.45,
    magnitudeStatus: "PASS" as const,
    sampleCount: 60,
  }));
}

describe("runContinuityVerification", () => {
  it("returns null when there are fewer than 8 pose frames", () => {
    const { frames, timestamps } = makeMotionFrames(4);
    expect(runContinuityVerification(frames, timestamps, makePassingRounds(3))).toBeNull();
  });

  it("returns null when there are no challenge rounds", () => {
    const { frames, timestamps } = makeMotionFrames(30);
    expect(runContinuityVerification(frames, timestamps, [])).toBeNull();
  });

  it("returns null when timestamps do not cover the frames", () => {
    const { frames } = makeMotionFrames(30);
    expect(runContinuityVerification(frames, [0, 1, 2], makePassingRounds(3))).toBeNull();
  });

  it("composes EE-001 + EE-003 into a signed, valid CPS-0001 receipt", () => {
    const { frames, timestamps } = makeMotionFrames(30);
    const rounds = makePassingRounds(3);

    const result = runContinuityVerification(frames, timestamps, rounds);

    expect(result).not.toBeNull();
    if (!result) return; // narrow for TS

    // Both evidence engines are present
    expect(result.evidenceEngines).toContain("EE-001");
    expect(result.evidenceEngines).toContain("EE-003");

    // Receipt is well-formed and self-verifies
    expect(result.receipt.protocolVersion).toBe("1.0");
    expect(result.receipt.receiptId).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.receipt.evidence).toHaveLength(2);
    expect(verifyReceipt(result.receipt).status).toBe("VALID");

    // result fields are faithful to the receipt (no fabrication)
    expect(result.verified).toBe(result.receipt.assertions.continuityMaintained.value);
    expect(result.confidence).toBe(result.receipt.assertions.continuityMaintained.confidence);
    expect(result.pes).toBeGreaterThanOrEqual(0);
    expect(result.pes).toBeLessThanOrEqual(1);
  });

  it("rejects no-rotation challenge (3/3 gate) regardless of presence", () => {
    const { frames, timestamps } = makeMotionFrames(30);
    const result = runContinuityVerification(frames, timestamps, makeNoRotationRounds(3));

    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.verified).toBe(false);
    expect(result.receipt.assertions.continuityMaintained.value).toBe(false);
    expect(verifyReceipt(result.receipt).status).toBe("VALID");
  });

  it("rejects wrong-direction challenge (full magnitude, wrong sign)", () => {
    const { frames, timestamps } = makeMotionFrames(30);
    const result = runContinuityVerification(frames, timestamps, makeWrongDirectionRounds(3));

    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.verified).toBe(false);
    expect(result.receipt.assertions.continuityMaintained.value).toBe(false);
    expect(verifyReceipt(result.receipt).status).toBe("VALID");
  });

  it("rejects partial challenge (2/3 correct)", () => {
    const { frames, timestamps } = makeMotionFrames(30);
    const rounds = [...makePassingRounds(2), ...makeNoRotationRounds(1)];
    const result = runContinuityVerification(frames, timestamps, rounds);

    expect(result).not.toBeNull();
    if (!result) return;

    expect(result.verified).toBe(false);
    expect(result.receipt.assertions.continuityMaintained.value).toBe(false);
    expect(verifyReceipt(result.receipt).status).toBe("VALID");
  });

  it("produces a distinct receipt for each run (fresh id, fresh signature)", () => {
    const { frames, timestamps } = makeMotionFrames(30);
    const rounds = makePassingRounds(3);

    const a = runContinuityVerification(frames, timestamps, rounds);
    const b = runContinuityVerification(frames, timestamps, rounds);

    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    if (!a || !b) return;

    expect(a.receipt.receiptId).not.toBe(b.receipt.receiptId);
  });
});

// ═══════════════════════════════════════════
// evaluateTwoStage — pure two-stage verdict
// ═══════════════════════════════════════════

describe("evaluateTwoStage", () => {
  it("(0.8, 1.0) → both stages pass, verified true, weakest-link confidence 0.8", () => {
    const v = evaluateTwoStage(0.8, 1.0);
    expect(v.stage1Pass).toBe(true);
    expect(v.stage2Pass).toBe(true);
    expect(v.verified).toBe(true);
    expect(v.confidence).toBe(0.8);
  });

  it("(0.8, 0.0) → challenge fails → verified false", () => {
    const v = evaluateTwoStage(0.8, 0.0);
    expect(v.stage1Pass).toBe(true);
    expect(v.stage2Pass).toBe(false);
    expect(v.verified).toBe(false);
    expect(v.confidence).toBe(0.0);
  });

  it("(0.4, 1.0) → presence fails → verified false (no compensation)", () => {
    const v = evaluateTwoStage(0.4, 1.0);
    expect(v.stage1Pass).toBe(false);
    expect(v.stage2Pass).toBe(true);
    expect(v.verified).toBe(false);
    expect(v.confidence).toBe(0.4);
  });

  it("(0.8, 0.45) → challenge below 1.0 → verified false", () => {
    const v = evaluateTwoStage(0.8, 0.45);
    expect(v.verified).toBe(false);
    expect(v.confidence).toBe(0.45);
  });
});
