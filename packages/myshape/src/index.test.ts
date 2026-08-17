// ═══════════════════════════════════════════════════════════════════
// verifyContinuity — two-stage verdict (v0.2) integration tests
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { verifyContinuity } from "./index.js";
import type { JointPosition } from "./presence-entropy.js";
import type { RoundResult } from "./gyro-challenge.js";
import type { IMUSample } from "./causal-coupling.js";

// ── Deterministic fixtures ──
//
// Stage 1 (EE-001) confidence is the Presence Entropy Score, computed
// internally from pose frames. We build two deterministic frame sets that
// land far from the 0.50 threshold so the verdict is stable:
//   human-like → alternating ±1 joint x (high noise residual + high
//                cross-joint jerk correlation) → PES ≈ 0.74 (≥ 0.50)
//   AI-like    → constant joint x (zero variance)             → PES = 0.00 (< 0.50)

function humanFrames(count = 60): Array<Record<number, JointPosition>> {
  const frames: Array<Record<number, JointPosition>> = [];
  for (let i = 0; i < count; i++) {
    const frame: Record<number, JointPosition> = {};
    const alt = i % 2 === 0 ? 1 : -1;
    for (let jid = 0; jid < 16; jid++) {
      frame[jid] = { x: alt, y: 0, z: 0 };
    }
    frames.push(frame);
  }
  return frames;
}

function aiFrames(count = 60): Array<Record<number, JointPosition>> {
  const frames: Array<Record<number, JointPosition>> = [];
  for (let i = 0; i < count; i++) {
    const frame: Record<number, JointPosition> = {};
    for (let jid = 0; jid < 16; jid++) {
      frame[jid] = { x: 400 + (jid % 8) * 30, y: 200, z: 0 };
    }
    frames.push(frame);
  }
  return frames;
}

function uniformTimestamps(count = 60): number[] {
  return Array.from({ length: count }, (_, i) => i * 33);
}

function passingRound(round: number): RoundResult {
  return { round, direction: "→", jitterMs: 500, angleDeg: 50, directionMatch: true, peakG: 0.3, magnitudeStatus: "PASS", sampleCount: 100 };
}

function failingRound(round: number): RoundResult {
  return { round, direction: "→", jitterMs: 300, angleDeg: 5, directionMatch: false, peakG: 0.05, magnitudeStatus: "FAIL", sampleCount: 80 };
}

function allPassRounds(): RoundResult[] {
  return [passingRound(1), passingRound(2), passingRound(3)];
}

function twoOfThreeRounds(): RoundResult[] {
  return [passingRound(1), passingRound(2), failingRound(3)];
}

function imuSamples(count = 20): IMUSample[] {
  return Array.from({ length: count }, (_, i) => ({ t: i * 16, ax: 0, ay: 0, az: 9.8, rx: 0, ry: 0, rz: 0, interval: 16 }));
}

// ── Two-stage verdict ──

describe("verifyContinuity — two-stage verdict (v0.2)", () => {
  it("Stage 1 PASS + Stage 2 PASS → verdict PASS, confidence = min(EE-001, EE-003)", async () => {
    const result = await verifyContinuity({
      imuSamples: [],
      frames: humanFrames(),
      timestamps: uniformTimestamps(),
      challengeResults: allPassRounds(),
    });

    expect(result.verdict).toBe("PASS");

    const ee001 = result.evidence.find((e) => e.engineId === "EE-001")!;
    const ee003 = result.evidence.find((e) => e.engineId === "EE-003")!;
    expect(ee001.confidence).toBeGreaterThanOrEqual(0.5); // Stage 1 threshold
    expect(ee003.confidence).toBe(1); // 3/3 binary gate
    expect(result.confidence).toBe(Math.min(ee001.confidence!, ee003.confidence!));
  });

  it("Stage 1 PASS + Stage 2 FAIL (2/3) → verdict FAIL, confidence 0", async () => {
    const result = await verifyContinuity({
      imuSamples: [],
      frames: humanFrames(),
      timestamps: uniformTimestamps(),
      challengeResults: twoOfThreeRounds(),
    });

    expect(result.verdict).toBe("FAIL");
    expect(result.confidence).toBe(0); // min(EE-001, 0) = 0 — presence must not compensate

    const ee003 = result.evidence.find((e) => e.engineId === "EE-003")!;
    expect(ee003.confidence).toBe(0); // 2/3 is not 0.667
  });

  it("Stage 1 FAIL + Stage 2 PASS → verdict FAIL", async () => {
    const result = await verifyContinuity({
      imuSamples: [],
      frames: aiFrames(),
      timestamps: uniformTimestamps(),
      challengeResults: allPassRounds(),
    });

    expect(result.verdict).toBe("FAIL");

    const ee001 = result.evidence.find((e) => e.engineId === "EE-001")!;
    const ee003 = result.evidence.find((e) => e.engineId === "EE-003")!;
    expect(ee001.confidence).toBeLessThan(0.5); // Stage 1 below threshold
    expect(ee003.confidence).toBe(1); // challenge passed, but presence failed
  });

  it("EE-002 does not affect verdict or confidence", async () => {
    const base = {
      frames: humanFrames(),
      timestamps: uniformTimestamps(),
      challengeResults: allPassRounds(),
    };

    const withoutEE002 = await verifyContinuity({ imuSamples: [], ...base });
    const withEE002 = await verifyContinuity({ imuSamples: imuSamples(), ...base });

    expect(withEE002.evidence.some((e) => e.engineId === "EE-002")).toBe(true);
    expect(withEE002.verdict).toBe(withoutEE002.verdict);
    expect(withEE002.confidence).toBe(withoutEE002.confidence);
  });

  it("missing Stage 2 (no challengeResults) → INSUFFICIENT_EVIDENCE", async () => {
    const result = await verifyContinuity({
      imuSamples: [],
      frames: humanFrames(),
      timestamps: uniformTimestamps(),
    });

    expect(result.verdict).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("missing Stage 1 (no frames/timestamps) → INSUFFICIENT_EVIDENCE", async () => {
    const result = await verifyContinuity({
      imuSamples: [],
      challengeResults: allPassRounds(),
    });

    expect(result.verdict).toBe("INSUFFICIENT_EVIDENCE");
  });
});

// ── Regression: public output shape ──

describe("verifyContinuity — public output shape", () => {
  it("returns verdict, confidence, evidence with EE-001 and EE-003", async () => {
    const result = await verifyContinuity({
      imuSamples: [],
      frames: humanFrames(),
      timestamps: uniformTimestamps(),
      challengeResults: allPassRounds(),
    });

    expect(result).toHaveProperty("verdict");
    expect(result).toHaveProperty("confidence");
    expect(result).toHaveProperty("evidence");
    expect(result.evidence.map((e) => e.engineId)).toEqual(expect.arrayContaining(["EE-001", "EE-003"]));
    expect(result.evidence.some((e) => e.engineId === "EE-002")).toBe(false); // EE-002 only when imuSamples provided
  });
});
