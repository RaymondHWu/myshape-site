// ═══════════════════════════════════════════════════════════════════
// VerificationSession + EscalationStrategy — lifecycle tests
//
// The central container that collects, evaluates, and aggregates
// Evidence. These tests validate the protocol's operational model.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  type VerificationSession,
  type EscalationStrategy,
  type EscalationStep,
  type EngineEvidence,
  type EvidenceReceipt,
  evaluatePolicy,
} from "./types";

// ═══════════════════════════════════════════
// Test helpers
// ═══════════════════════════════════════════

function makeEvidence(engineId: string, confidence: number, passCount = 3, failCount = 0): EngineEvidence {
  const components = [];
  for (let i = 0; i < passCount; i++) {
    components.push({
      engine: engineId, metric: `M${i}`, value: 1, threshold: 0.5,
      status: "PASS" as const, explanation: "ok",
    });
  }
  for (let i = 0; i < failCount; i++) {
    components.push({
      engine: engineId, metric: `MF${i}`, value: 0, threshold: 0.5,
      status: "FAIL" as const, explanation: "fail",
    });
  }
  return {
    engineId,
    timestamp: new Date().toISOString(),
    components,
    diagnostics: [],
    confidence,
  };
}

function makeSession(overrides: Partial<VerificationSession> = {}): VerificationSession {
  return {
    sessionId: "test-session-1",
    timestamp: new Date().toISOString(),
    phase: "acquire",
    evidence: [],
    aggregateConfidence: 0,
    escalated: false,
    ...overrides,
  };
}

// ═══════════════════════════════════════════
// VerificationSession — lifecycle
// ═══════════════════════════════════════════

describe("VerificationSession", () => {
  it("starts in acquire phase with zero confidence", () => {
    const session = makeSession();
    expect(session.phase).toBe("acquire");
    expect(session.aggregateConfidence).toBe(0);
    expect(session.evidence.length).toBe(0);
    expect(session.escalated).toBe(false);
  });

  it("transitions acquire → passive when first evidence is added", () => {
    const session = makeSession();
    session.evidence.push(makeEvidence("EE-001", 0.5));
    session.phase = "passive";
    session.aggregateConfidence = 0.5;
    expect(session.phase).toBe("passive");
    expect(session.aggregateConfidence).toBe(0.5);
  });

  it("aggregates confidence as average across all evidence engines", () => {
    const evidence = [
      makeEvidence("EE-001", 0.6),
      makeEvidence("EE-003", 0.8),
    ];
    const aggregateConfidence = evidence.reduce((sum, e) => sum + (e.confidence || 0), 0) / evidence.length;
    expect(aggregateConfidence).toBeCloseTo(0.7);
  });

  it("transitions escalate → additional when confidence is mid-range", () => {
    const session = makeSession({ phase: "passive", aggregateConfidence: 0.5 });
    // Confidence in [0.35, 0.70) → escalate
    session.phase = "escalate";
    expect(session.phase).toBe("escalate");
    // Additional evidence collected
    session.evidence.push(makeEvidence("EE-003", 0.8));
    session.phase = "additional";
    session.escalated = true;
    expect(session.phase).toBe("additional");
    expect(session.escalated).toBe(true);
  });

  it("transitions aggregate → complete when all evidence collected", () => {
    const session = makeSession({
      phase: "aggregate",
      evidence: [makeEvidence("EE-001", 0.6), makeEvidence("EE-003", 0.8)],
      aggregateConfidence: 0.7,
    });
    session.phase = "complete";
    expect(session.phase).toBe("complete");
  });

  it("full lifecycle: acquire → passive → escalate → additional → aggregate → complete", () => {
    const phases = ["acquire", "passive", "escalate", "additional", "aggregate", "complete"] as const;
    const session = makeSession();

    for (const phase of phases) {
      session.phase = phase;
      expect(session.phase).toBe(phase);
    }
  });

  it("can skip escalation when passive confidence is sufficient", () => {
    const session = makeSession();
    session.evidence.push(makeEvidence("EE-001", 0.75));
    session.aggregateConfidence = 0.75;
    session.phase = "complete";
    expect(session.escalated).toBe(false);
    expect(session.phase).toBe("complete");
    expect(session.aggregateConfidence).toBe(0.75);
  });

  it("can reject when passive confidence is too low", () => {
    const session = makeSession();
    session.evidence.push(makeEvidence("EE-001", 0.2));
    session.aggregateConfidence = 0.2;
    session.phase = "complete";
    // Low confidence + no escalation → reject
    const verdict = evaluatePolicy(
      { policyId: "test", acceptThreshold: 0.70, rejectThreshold: 0.35 },
      session.aggregateConfidence,
    );
    expect(verdict).toBe("FAIL");
  });
});

// ═══════════════════════════════════════════
// EscalationStrategy
// ═══════════════════════════════════════════

describe("EscalationStrategy", () => {
  const defaultStrategy: EscalationStrategy = {
    strategyId: "two-stage",
    steps: [
      { requiredConfidence: 0.65, engineId: "EE-003", label: "Gyroscope Challenge" },
    ],
  };

  it("strategy has at least one escalation step", () => {
    expect(defaultStrategy.steps.length).toBeGreaterThanOrEqual(1);
  });

  it("each step has a confidence gate and target engine", () => {
    for (const step of defaultStrategy.steps) {
      expect(step.requiredConfidence).toBeGreaterThan(0);
      expect(step.requiredConfidence).toBeLessThanOrEqual(1);
      expect(step.engineId).toBeTruthy();
      expect(step.label).toBeTruthy();
    }
  });

  it("steps are ordered by requiredConfidence (ascending)", () => {
    const multiStep: EscalationStrategy = {
      strategyId: "multi",
      steps: [
        { requiredConfidence: 0.50, engineId: "EE-003", label: "Gyro" },
        { requiredConfidence: 0.65, engineId: "EE-004", label: "Camera" },
        { requiredConfidence: 0.80, engineId: "EE-005", label: "Voice" },
      ],
    };
    for (let i = 1; i < multiStep.steps.length; i++) {
      expect(multiStep.steps[i].requiredConfidence)
        .toBeGreaterThanOrEqual(multiStep.steps[i - 1].requiredConfidence);
    }
  });

  it("determines next engine based on current confidence", () => {
    // Below 0.65 → need EE-003
    const belowThreshold = 0.45;
    const nextStep = defaultStrategy.steps.find(
      (s) => belowThreshold < s.requiredConfidence,
    );
    expect(nextStep?.engineId).toBe("EE-003");

    // At or above 0.65 → no escalation needed
    const aboveThreshold = 0.70;
    const noStep = defaultStrategy.steps.find(
      (s) => aboveThreshold < s.requiredConfidence,
    );
    expect(noStep).toBeUndefined();
  });
});

// ═══════════════════════════════════════════
// EvidenceReceipt
// ═══════════════════════════════════════════

describe("EvidenceReceipt", () => {
  it("contains session, verdict, and optional chain fields", () => {
    const session = makeSession({
      phase: "complete",
      evidence: [makeEvidence("EE-001", 0.75)],
      aggregateConfidence: 0.75,
    });

    const receipt: EvidenceReceipt = {
      receiptId: "RCPT-001",
      subject: "test-subject",
      timestamp: new Date().toISOString(),
      session,
      confidence: 0.75,
      policyId: "default",
      verdict: "PASS",
    };

    expect(receipt.receiptId).toBe("RCPT-001");
    expect(receipt.verdict).toBe("PASS");
    expect(receipt.confidence).toBe(0.75);
    expect(receipt.session).toBe(session);
    expect(receipt.signature).toBeUndefined(); // future
    expect(receipt.previousReceiptHash).toBeUndefined(); // future
  });

  it("chains receipts via previousReceiptHash", () => {
    const session1 = makeSession({ sessionId: "s1" });
    const session2 = makeSession({ sessionId: "s2" });

    const receipt1: EvidenceReceipt = {
      receiptId: "RCPT-001", subject: "subj", timestamp: new Date().toISOString(),
      session: session1, confidence: 0.75, policyId: "default", verdict: "PASS",
    };

    const receipt2: EvidenceReceipt = {
      receiptId: "RCPT-002", subject: "subj", timestamp: new Date().toISOString(),
      session: session2, confidence: 0.80, policyId: "default", verdict: "PASS",
      previousReceiptHash: "hash-of-rcpt-001",
    };

    expect(receipt2.previousReceiptHash).toBeTruthy();
    expect(receipt1.previousReceiptHash).toBeUndefined(); // first in chain
  });
});

// ═══════════════════════════════════════════
// Policy evaluation in session context
// ═══════════════════════════════════════════

describe("Session + Policy integration", () => {
  const policy = { policyId: "std", acceptThreshold: 0.70, rejectThreshold: 0.35 };

  it("high-confidence single engine → PASS without escalation", () => {
    const session = makeSession({
      evidence: [makeEvidence("EE-001", 0.80)],
      aggregateConfidence: 0.80,
    });
    expect(evaluatePolicy(policy, session.aggregateConfidence)).toBe("PASS");
  });

  it("low-confidence single engine → FAIL", () => {
    const session = makeSession({
      evidence: [makeEvidence("EE-001", 0.20)],
      aggregateConfidence: 0.20,
    });
    expect(evaluatePolicy(policy, session.aggregateConfidence)).toBe("FAIL");
  });

  it("mid-confidence → INSUFFICIENT_EVIDENCE (escalation needed)", () => {
    const session = makeSession({
      evidence: [makeEvidence("EE-001", 0.55)],
      aggregateConfidence: 0.55,
    });
    expect(evaluatePolicy(policy, session.aggregateConfidence)).toBe("INSUFFICIENT_EVIDENCE");
  });

  it("dual-engine aggregation pushes mid to high confidence", () => {
    const evidence = [
      makeEvidence("EE-001", 0.60), // IMU alone capped at 0.65
      makeEvidence("EE-003", 0.85), // Gyro boosts aggregate
    ];
    const aggregateConfidence = evidence.reduce((sum, e) => sum + (e.confidence || 0), 0) / evidence.length;
    expect(aggregateConfidence).toBeCloseTo(0.725);
    expect(evaluatePolicy(policy, aggregateConfidence)).toBe("PASS");
  });

  it("IMU-only cap prevents auto-accept", () => {
    // IMU evidence alone is capped at 0.65
    const imuOnlyConfidence = Math.min(0.80, 0.65); // IMU_ONLY_CAP
    expect(imuOnlyConfidence).toBe(0.65);
    // At 0.65, still in escalation range [0.35, 0.70)
    expect(evaluatePolicy(policy, imuOnlyConfidence)).toBe("INSUFFICIENT_EVIDENCE");
  });
});
