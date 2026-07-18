import { describe, it, expect } from "vitest";
import {
  evaluatePolicy,
  computeStatus,
  computeHint,
  defaultPolicy,
  hashEvidence,
  type EngineEvidence,
} from "./types";

describe("evaluatePolicy", () => {
  const policy = { policyId: "test", acceptThreshold: 0.70, rejectThreshold: 0.35 };

  it("returns PASS when confidence ≥ accept threshold", () => {
    expect(evaluatePolicy(policy, 0.70)).toBe("PASS");
    expect(evaluatePolicy(policy, 0.95)).toBe("PASS");
  });

  it("returns FAIL when confidence < reject threshold", () => {
    expect(evaluatePolicy(policy, 0.34)).toBe("FAIL");
    expect(evaluatePolicy(policy, 0.0)).toBe("FAIL");
  });

  it("returns INSUFFICIENT_EVIDENCE when confidence is between thresholds", () => {
    expect(evaluatePolicy(policy, 0.35)).toBe("INSUFFICIENT_EVIDENCE");
    expect(evaluatePolicy(policy, 0.50)).toBe("INSUFFICIENT_EVIDENCE");
    expect(evaluatePolicy(policy, 0.69)).toBe("INSUFFICIENT_EVIDENCE");
  });
});

describe("computeStatus", () => {
  it("returns PASS when value ≥ threshold", () => {
    expect(computeStatus(0.5, 0.3)).toBe("PASS");
    expect(computeStatus(1.0, 0.5)).toBe("PASS");
  });

  it("returns FAIL when value < threshold but > insufficientValue", () => {
    expect(computeStatus(0.2, 0.3)).toBe("FAIL");
    expect(computeStatus(0.0, 0.5)).toBe("FAIL");
  });

  it("returns INSUFFICIENT when value ≤ insufficientValue", () => {
    expect(computeStatus(-1, 0.3)).toBe("INSUFFICIENT");
    expect(computeStatus(-2, 0.3, -2)).toBe("INSUFFICIENT");
  });
});

describe("hashEvidence", () => {
  it("produces a 64-char hex digest", async () => {
    const ev: EngineEvidence = {
      engineId: "EE-001",
      timestamp: "2026-01-01T00:00:00.000Z",
      components: [{ engine: "EE-001", metric: "Test", value: 1, threshold: 0.5, status: "PASS", explanation: "test" }],
      diagnostics: ["this should NOT be in digest"],
      confidence: 0.8,
    };
    const digest = await hashEvidence(ev);
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });

  it("produces different digests for different evidence", async () => {
    const ev1: EngineEvidence = { engineId: "EE-001", timestamp: "a", components: [], diagnostics: [] };
    const ev2: EngineEvidence = { engineId: "EE-001", timestamp: "b", components: [], diagnostics: [] };
    expect(await hashEvidence(ev1)).not.toBe(await hashEvidence(ev2));
  });

  it("diagnostics changes do NOT affect digest", async () => {
    const ev1: EngineEvidence = { engineId: "EE-001", timestamp: "t", components: [{ engine: "EE-001", metric: "M", value: 1, threshold: 0.5, status: "PASS", explanation: "x" }], diagnostics: ["hello"] };
    const ev2: EngineEvidence = { ...ev1, diagnostics: ["world"] };
    expect(await hashEvidence(ev1)).toBe(await hashEvidence(ev2));
  });

  it("confidence changes do NOT affect digest", async () => {
    const ev1: EngineEvidence = { engineId: "EE-001", timestamp: "t", components: [], diagnostics: [], confidence: 0.9 };
    const ev2: EngineEvidence = { engineId: "EE-001", timestamp: "t", components: [], diagnostics: [], confidence: 0.1 };
    expect(await hashEvidence(ev1)).toBe(await hashEvidence(ev2));
  });
});

// ═══════════════════════════════════════════
// computeHint
// ═══════════════════════════════════════════

describe("computeHint", () => {
  it("returns undefined for PASS status", () => {
    expect(computeHint("IMU_PES", "PASS")).toBeUndefined();
    expect(computeHint("Camera_PES", "PASS")).toBeUndefined();
    expect(computeHint("EventDensity", "PASS")).toBeUndefined();
  });

  it("returns FAIL hint for known metric", () => {
    const hint = computeHint("IMU_PES", "FAIL");
    expect(hint).toBeDefined();
    expect(hint).toContain("briskly");
  });

  it("returns INSUFFICIENT hint for known metric", () => {
    const hint = computeHint("IMU_PES", "INSUFFICIENT");
    expect(hint).toBeDefined();
    expect(hint).toContain("HTTPS");
  });

  it("returns undefined for unknown metric", () => {
    expect(computeHint("UnknownMetric", "FAIL")).toBeUndefined();
    expect(computeHint("UnknownMetric", "INSUFFICIENT")).toBeUndefined();
  });

  it("returns different hints for FAIL vs INSUFFICIENT for same metric", () => {
    const failHint = computeHint("IMU_PES", "FAIL");
    const insufHint = computeHint("IMU_PES", "INSUFFICIENT");
    expect(failHint).not.toBe(insufHint);
  });

  it("covers all catalogued metrics", () => {
    const metrics = ["IMU_PES", "Camera_PES", "IMU_Similarity", "Camera_Similarity",
      "EventDensity", "TemporalAlignment", "DirectionAgreement", "CausalEvidence"];
    for (const metric of metrics) {
      expect(computeHint(metric, "FAIL")).toBeDefined();
      expect(computeHint(metric, "INSUFFICIENT")).toBeDefined();
    }
  });
});

// ═══════════════════════════════════════════
// defaultPolicy
// ═══════════════════════════════════════════

describe("defaultPolicy", () => {
  it("returns INSUFFICIENT_EVIDENCE for empty evidence list", () => {
    expect(defaultPolicy([])).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("returns PASS when all components pass", () => {
    const ev: EngineEvidence = {
      engineId: "EE-001", timestamp: "t", components: [
        { engine: "EE-001", metric: "M", value: 1, threshold: 0.5, status: "PASS", explanation: "" },
      ], diagnostics: [],
    };
    expect(defaultPolicy([ev])).toBe("PASS");
  });

  it("returns FAIL when any component fails", () => {
    const ev: EngineEvidence = {
      engineId: "EE-001", timestamp: "t", components: [
        { engine: "EE-001", metric: "M1", value: 1, threshold: 0.5, status: "PASS", explanation: "" },
        { engine: "EE-001", metric: "M2", value: 0, threshold: 0.5, status: "FAIL", explanation: "" },
      ], diagnostics: [],
    };
    expect(defaultPolicy([ev])).toBe("FAIL");
  });

  it("returns INSUFFICIENT_EVIDENCE when any component is INSUFFICIENT", () => {
    const ev: EngineEvidence = {
      engineId: "EE-001", timestamp: "t", components: [
        { engine: "EE-001", metric: "M1", value: 1, threshold: 0.5, status: "PASS", explanation: "" },
        { engine: "EE-001", metric: "M2", value: -1, threshold: 0.5, status: "INSUFFICIENT", explanation: "" },
      ], diagnostics: [],
    };
    expect(defaultPolicy([ev])).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("INSUFFICIENT takes priority over FAIL (checked first)", () => {
    const ev: EngineEvidence = {
      engineId: "EE-001", timestamp: "t", components: [
        { engine: "EE-001", metric: "M1", value: -1, threshold: 0.5, status: "INSUFFICIENT", explanation: "" },
        { engine: "EE-001", metric: "M2", value: 0, threshold: 0.5, status: "FAIL", explanation: "" },
      ], diagnostics: [],
    };
    // defaultPolicy checks INSUFFICIENT before FAIL
    expect(defaultPolicy([ev])).toBe("INSUFFICIENT_EVIDENCE");
  });
});

// ═══════════════════════════════════════════
// evaluatePolicy — edge cases
// ═══════════════════════════════════════════

describe("evaluatePolicy edge cases", () => {
  const policy = { policyId: "test", acceptThreshold: 0.70, rejectThreshold: 0.35 };

  it("handles confidence exactly at 0", () => {
    expect(evaluatePolicy(policy, 0)).toBe("FAIL");
  });

  it("handles confidence exactly at 1.0", () => {
    expect(evaluatePolicy(policy, 1.0)).toBe("PASS");
  });

  it("handles confidence at rejectThreshold boundary", () => {
    // 0.35 is >= rejectThreshold but < acceptThreshold → INSUFFICIENT
    expect(evaluatePolicy(policy, 0.35)).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("handles confidence at acceptThreshold boundary", () => {
    // 0.70 is >= acceptThreshold → PASS
    expect(evaluatePolicy(policy, 0.70)).toBe("PASS");
  });
});

// ═══════════════════════════════════════════
// computeStatus — edge cases
// ═══════════════════════════════════════════

describe("computeStatus edge cases", () => {
  it("handles value exactly at threshold (PASS boundary)", () => {
    expect(computeStatus(0.3, 0.3)).toBe("PASS");
  });

  it("handles value just below threshold", () => {
    expect(computeStatus(0.299, 0.3)).toBe("FAIL");
  });

  it("handles value at insufficientValue boundary (exactly -1)", () => {
    expect(computeStatus(-1, 0.3)).toBe("INSUFFICIENT");
  });

  it("handles value just above insufficientValue when negative", () => {
    // -0.5 > -1 but < 0.3 threshold → FAIL (not INSUFFICIENT)
    expect(computeStatus(-0.5, 0.3)).toBe("FAIL");
  });
});
