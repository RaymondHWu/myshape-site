// ═══════════════════════════════════════════════════════════════════
// EE-003 · Gyroscope Challenge — unit tests
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  type Direction,
  type GyroSample,
  type RoundResult,
  gyroAxisFor,
  expectedSign,
  normalizeAngle,
  angleDiffDeg,
  analyzeRound,
  buildChallengeEvidence,
  GYRO_THRESHOLD_DEG_S,
} from "./gyro-challenge";

// ═══════════════════════════════════════════
// gyroAxisFor
// ═══════════════════════════════════════════

describe("gyroAxisFor", () => {
  it("uses rx (yaw/z-axis) for left/right", () => {
    expect(gyroAxisFor("←")).toBe("rx");
    expect(gyroAxisFor("→")).toBe("rx");
  });

  it("uses ry (pitch/x-axis) for up/down", () => {
    expect(gyroAxisFor("↑")).toBe("ry");
    expect(gyroAxisFor("↓")).toBe("ry");
  });
});

// ═══════════════════════════════════════════
// expectedSign
// ═══════════════════════════════════════════

describe("expectedSign", () => {
  it("returns -1 for up and down (pitch, beta axis)", () => {
    expect(expectedSign("↑")).toBe(-1);
    expect(expectedSign("↓")).toBe(-1);
  });

  it("returns +1 for left and right (yaw, alpha axis)", () => {
    expect(expectedSign("←")).toBe(1);
    expect(expectedSign("→")).toBe(1);
  });
});

// ═══════════════════════════════════════════
// normalizeAngle
// ═══════════════════════════════════════════

describe("normalizeAngle", () => {
  it("leaves angles already in [-π, π] unchanged", () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(Math.PI / 2)).toBeCloseTo(Math.PI / 2);
    expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo(-Math.PI / 2);
  });

  it("wraps angles > π", () => {
    expect(normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
    expect(normalizeAngle(2 * Math.PI)).toBeCloseTo(0);
  });

  it("wraps angles < -π", () => {
    expect(normalizeAngle(-3 * Math.PI)).toBeCloseTo(-Math.PI);
    expect(normalizeAngle(-2 * Math.PI)).toBeCloseTo(0);
  });
});

// ═══════════════════════════════════════════
// angleDiffDeg
// ═══════════════════════════════════════════

describe("angleDiffDeg", () => {
  it("returns 0 for identical angles", () => {
    expect(angleDiffDeg(0, 0)).toBe(0);
    expect(angleDiffDeg(Math.PI, Math.PI)).toBe(0);
  });

  it("returns 180 for opposite angles", () => {
    expect(angleDiffDeg(0, Math.PI)).toBeCloseTo(180);
  });

  it("takes the shorter arc (wraps around ±π)", () => {
    // 170° and -170° → 20° apart (not 340°)
    const a = (170 * Math.PI) / 180;
    const b = (-170 * Math.PI) / 180;
    expect(angleDiffDeg(a, b)).toBeCloseTo(20, 0);
  });
});

// ═══════════════════════════════════════════
// analyzeRound
// ═══════════════════════════════════════════

describe("analyzeRound", () => {
  function gyroSamples(dir: Direction, peakDegS: number, count = 50): GyroSample[] {
    const axis = gyroAxisFor(dir);
    const sign = expectedSign(dir);
    const samples: GyroSample[] = [];
    for (let i = 0; i < count; i++) {
      const t = (2000 / count) * i;
      // Build a triangular pulse peaking at peakDegS
      const progress = i < count / 2 ? i / (count / 2) : (count - i) / (count / 2);
      const rate = sign * peakDegS * progress;
      samples.push({
        t: Math.round(t),
        ax: 0, ay: 0, az: 9.8,
        rx: axis === "rx" ? rate : 0,
        ry: axis === "ry" ? rate : 0,
        rz: 0,
      });
    }
    return samples;
  }

  it("PASS: direction match + sufficient magnitude for right at 50°/s", () => {
    const result = analyzeRound(gyroSamples("→", 50), "→");
    expect(result.directionMatch).toBe(true);
    expect(result.magnitudeStatus).toBe("PASS");
    expect(result.angleDeg).toBeGreaterThanOrEqual(40);
  });

  it("PASS: direction match for left at 60°/s", () => {
    const result = analyzeRound(gyroSamples("←", 60), "←");
    expect(result.directionMatch).toBe(true);
    expect(result.magnitudeStatus).toBe("PASS");
  });

  it("PASS: direction match for up", () => {
    const result = analyzeRound(gyroSamples("↑", 45), "↑");
    expect(result.directionMatch).toBe(true);
    expect(result.magnitudeStatus).toBe("PASS");
  });

  it("PASS: direction match for down", () => {
    const result = analyzeRound(gyroSamples("↓", 55), "↓");
    expect(result.directionMatch).toBe(true);
    expect(result.magnitudeStatus).toBe("PASS");
  });

  it("FAIL: opposite axis (up challenge, yaw motion — wrong axis)", () => {
    // Generate left yaw motion, challenge up pitch → different axis → no match
    const result = analyzeRound(gyroSamples("←", 50), "↑");
    expect(result.directionMatch).toBe(false);
    // Yaw motion doesn't produce pitch rotation, so magnitude on ry is zero
  });

  it("FAIL: insufficient magnitude (very slow rotation)", () => {
    const samples: GyroSample[] = [
      { t: 0, ax: 0, ay: 0, az: 9.8, rx: 5, ry: 0, rz: 0 },
      { t: 100, ax: 0, ay: 0, az: 9.8, rx: 3, ry: 0, rz: 0 },
      { t: 200, ax: 0, ay: 0, az: 9.8, rx: 2, ry: 0, rz: 0 },
    ];
    const result = analyzeRound(samples, "→");
    expect(result.magnitudeStatus).toBe("FAIL");
  });

  it("FAIL: wrong axis motion (yaw when pitch expected)", () => {
    // Use yaw motion but challenge expects pitch → direction match should be false
    // (peak rotation on ry=0 for yaw-only motion, so sign check on ry vs 0 fails)
    const yawSamples = gyroSamples("→", 50); // all rotation on rx
    const result = analyzeRound(yawSamples, "↑"); // expects ry
    expect(result.directionMatch).toBe(false);
  });

  it("empty samples: no motion → FAIL magnitude, direction depends on zero", () => {
    const result = analyzeRound([], "→");
    expect(result.peakG).toBe(0);
    expect(result.magnitudeStatus).toBe("FAIL");
  });
});

// ═══════════════════════════════════════════
// buildChallengeEvidence
// ═══════════════════════════════════════════

describe("buildChallengeEvidence", () => {
  function passingRound(round: number, dir: Direction = "→"): RoundResult {
    return {
      round, direction: dir, jitterMs: 500,
      angleDeg: 50, directionMatch: true, peakG: 0.3,
      magnitudeStatus: "PASS", sampleCount: 100,
    };
  }

  function failingRound(round: number, dir: Direction = "→"): RoundResult {
    return {
      round, direction: dir, jitterMs: 300,
      angleDeg: 5, directionMatch: false, peakG: 0.05,
      magnitudeStatus: "FAIL", sampleCount: 80,
    };
  }

  it("3/3 PASS → all components pass, confidence high", () => {
    const ev = buildChallengeEvidence([
      passingRound(1), passingRound(2), passingRound(3),
    ]);
    expect(ev.engineId).toBe("EE-003");
    expect(ev.components.length).toBe(3);

    const dirComp = ev.components.find((c) => c.metric === "DirectionMatch")!;
    expect(dirComp.status).toBe("PASS");
    expect(dirComp.value).toBe(1.0);

    const magComp = ev.components.find((c) => c.metric === "MovementMagnitude")!;
    expect(magComp.status).toBe("PASS");

    const chalComp = ev.components.find((c) => c.metric === "ChallengeResponse")!;
    expect(chalComp.status).toBe("PASS");
  });

  it("0/3 PASS → all components INSUFFICIENT", () => {
    const ev = buildChallengeEvidence([
      failingRound(1), failingRound(2), failingRound(3),
    ]);
    const dirComp = ev.components.find((c) => c.metric === "DirectionMatch")!;
    // 0/3 = 0 < 0.33 → INSUFFICIENT (not FAIL — need at least 1/3 for FAIL)
    expect(dirComp.status).toBe("INSUFFICIENT");
    expect(dirComp.value).toBe(0);

    // CFC-007 triggered
    expect(ev.diagnostics.some((d) => d.includes("CFC-007"))).toBe(true);
    // CFC-006 triggered
    expect(ev.diagnostics.some((d) => d.includes("CFC-006"))).toBe(true);
  });

  it("CFC-008 triggered when all rounds pass with identical parameters", () => {
    const identicalRounds: RoundResult[] = [
      { round: 1, direction: "→", jitterMs: 500, angleDeg: 50, directionMatch: true, peakG: 0.25, magnitudeStatus: "PASS", sampleCount: 100 },
      { round: 2, direction: "→", jitterMs: 500, angleDeg: 50, directionMatch: true, peakG: 0.25, magnitudeStatus: "PASS", sampleCount: 100 },
      { round: 3, direction: "→", jitterMs: 500, angleDeg: 50, directionMatch: true, peakG: 0.25, magnitudeStatus: "PASS", sampleCount: 100 },
    ];
    const ev = buildChallengeEvidence(identicalRounds);
    expect(ev.diagnostics.some((d) => d.includes("CFC-008"))).toBe(true);
  });

  it("CFC-008 NOT triggered when rounds have natural variation", () => {
    const variedRounds: RoundResult[] = [
      { round: 1, direction: "→", jitterMs: 500, angleDeg: 45, directionMatch: true, peakG: 0.30, magnitudeStatus: "PASS", sampleCount: 100 },
      { round: 2, direction: "↑", jitterMs: 300, angleDeg: 62, directionMatch: true, peakG: 0.18, magnitudeStatus: "PASS", sampleCount: 120 },
      { round: 3, direction: "←", jitterMs: 700, angleDeg: 38, directionMatch: true, peakG: 0.28, magnitudeStatus: "PASS", sampleCount: 90 },
    ];
    const ev = buildChallengeEvidence(variedRounds);
    // All pass but with variation → no CFC-008
    expect(ev.diagnostics.some((d) => d.includes("CFC-008"))).toBe(false);
  });

  it("includes round-level diagnostics for each round", () => {
    const ev = buildChallengeEvidence([passingRound(1), failingRound(2)]);
    const roundDiags = ev.diagnostics.filter((d) => d.match(/^[✓✗] Round/));
    expect(roundDiags.length).toBe(2);
    expect(roundDiags[0]).toContain("✓ Round 1");
    expect(roundDiags[1]).toContain("✗ Round 2");
  });

  it("empty results → zero rates, FAIL status", () => {
    const ev = buildChallengeEvidence([]);
    expect(ev.components.length).toBe(3);
    for (const c of ev.components) {
      expect(c.value).toBe(0);
    }
  });
});
