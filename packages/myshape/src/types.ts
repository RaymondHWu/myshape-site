// ═══════════════════════════════════════════════════════════════════
// Evidence Object v1 (Draft)
//
// Unified data model for all Evidence Engines (EE-xxx).
// Evidence describes itself — it does NOT interpret itself.
// Verdict comes from VerificationPolicy, not from Evidence.
//
// Principles:
//   1. Engine-agnostic: same ComponentEvidence shape for EE-001..EE-00N
//   2. Self-describing: value, threshold, status, explanation — not opaque
//   3. Verdict-free: Evidence is a knowledge object, Policy decides
//   4. Hint is guidance for evidence ACQUISITION, not interpretation of continuity
//   5. Digest covers only evidence-bearing fields — not human-readable diagnostics
//   6. Conservative evolution: fields are added only when required by multiple
//      independent Evidence Engines — not by anticipated future use.
//      Record the need, wait for a second call site, then add to the schema.
//
// Lifecycle:  generate → inspect → digest → (future: sign → receipt → chain)
// ═══════════════════════════════════════════════════════════════════

// ── ComponentEvidence — per-metric check ──
//
// Stable schema. Do not change lightly.
// Future (v0.5+): threshold may become evaluation: { criterion, result }
//   to accommodate non-numeric criteria (TEE valid/invalid, Challenge matched/not-matched).
// Future (v0.3+): hint may become { title, message, severity, action } object.

export type EvidenceStatus = "PASS" | "FAIL" | "INSUFFICIENT";

export interface ComponentEvidence {
  /** Engine that produced this evidence (e.g. "EE-001") */
  engine: string;
  /** Metric name (e.g. "IMU_PES", "TemporalAlignment", "DirectionAgreement") */
  metric: string;
  /** Computed value */
  value: number;
  /** Threshold for PASS (may be 0 if not applicable) */
  threshold: number;
  /** Result status */
  status: EvidenceStatus;
  /** Human-readable explanation of the value and status */
  explanation: string;
  /**
   * Actionable hint for FAIL/INSUFFICIENT status.
   * IMPORTANT: hint guides evidence ACQUISITION ("how to get better data"),
   * not interpretation ("why you failed"). It tells the user how to improve
   * sensor input — it does not explain continuity.
   */
  hint?: string;
}

// ── EngineEvidence — output of one Evidence Engine ──
//
// Evidence describes itself — it does NOT interpret itself.
// Verdict is the Session's job, not the Evidence's.
// confidence = this engine's contribution to the session's aggregate confidence.

export interface EngineEvidence {
  /** Engine ID (e.g. "EE-001") */
  engineId: string;
  /** ISO 8601 timestamp of evidence generation */
  timestamp: string;
  /** Evidence components produced by this engine */
  components: ComponentEvidence[];
  /** Human-readable diagnostics (NOT included in digest) */
  diagnostics: string[];
  /**
   * This engine's contribution to the aggregate confidence (0–1).
   * Not a verdict — just how much this evidence supports the continuity claim.
   * Set by the engine, aggregated by the VerificationSession.
   */
  confidence?: number;
  /**
   * SHA-256 digest of the evidence payload (timestamp + engineId + components).
   * Diagnostics and confidence are deliberately excluded — they are interpretation,
   * not evidence.
   */
  evidenceDigest?: string;
}

// ── VerificationSession — the container that collects, evaluates, and aggregates Evidence ──
//
// Exists BETWEEN individual engines and the Receipt.
// Owns the decision logic. Evidence does not know its own verdict.

export type SessionPhase = "acquire" | "passive" | "escalate" | "additional" | "aggregate" | "complete";

export interface VerificationSession {
  sessionId: string;
  timestamp: string;
  phase: SessionPhase;
  /** All evidence collected so far */
  evidence: EngineEvidence[];
  /** Aggregate confidence 0–1, updated after each evidence collection step */
  aggregateConfidence: number;
  /** Whether additional evidence was requested (escalation occurred) */
  escalated: boolean;
}

// ── EscalationStrategy — decides whether to request additional evidence ──
//
// Not a fixed Stage 2. A configurable policy that decides,
// given current confidence, which engine to invoke next (if any).

export interface EscalationStep {
  /** Minimum confidence to reach before this step is considered satisfied */
  requiredConfidence: number;
  /** Engine to invoke if confidence is below threshold */
  engineId: string;
  /** Friendly name for UI */
  label: string;
}

export interface EscalationStrategy {
  strategyId: string;
  steps: EscalationStep[];
}

// ── VerificationPolicy — interprets Session confidence → Verdict ──

export type Verdict = "PASS" | "FAIL" | "INSUFFICIENT_EVIDENCE" | "CONTRADICTORY" | "EXPIRED";

export interface VerificationPolicy {
  policyId: string;
  /** Minimum aggregate confidence to accept */
  acceptThreshold: number;
  /** Minimum aggregate confidence to escalate (below this → reject) */
  rejectThreshold: number;
}

/** Default policy: ≥0.70 accept, <0.35 reject, between → escalate */
export function evaluatePolicy(policy: VerificationPolicy, confidence: number): Verdict {
  if (confidence >= policy.acceptThreshold) return "PASS";
  if (confidence < policy.rejectThreshold) return "FAIL";
  return "INSUFFICIENT_EVIDENCE"; // escalation was attempted but confidence still low
}

// ── EvidenceReceipt (future) — signed, chainable evidence container ──

export interface EvidenceReceipt {
  receiptId: string;
  subject: string;
  timestamp: string;
  /** The verification session that produced this receipt */
  session: VerificationSession;
  /** Aggregate confidence at time of receipt */
  confidence: number;
  /** Policy that was applied */
  policyId: string;
  /** Final decision */
  verdict: Verdict;
  /** Cryptographic signature (future) */
  signature?: string;
  /** Hash of previous receipt in the continuity chain */
  previousReceiptHash?: string;
}

// ── Deprecated: remove once all consumers use evaluatePolicy ──
/** @deprecated Use evaluatePolicy + VerificationSession instead */
export function defaultPolicy(evidenceList: EngineEvidence[]): Verdict {
  const allComponents = evidenceList.flatMap((e) => e.components);
  if (allComponents.length === 0) return "INSUFFICIENT_EVIDENCE";
  const hasInsufficient = allComponents.some((c) => c.status === "INSUFFICIENT");
  if (hasInsufficient) return "INSUFFICIENT_EVIDENCE";
  const hasFailure = allComponents.some((c) => c.status === "FAIL");
  if (hasFailure) return "FAIL";
  return "PASS";
}

// ── Helpers ──

/** Compute status from value vs threshold. Returns INSUFFICIENT when value is meaningfully absent. */
export function computeStatus(value: number, threshold: number, insufficientValue = -1): EvidenceStatus {
  if (value <= insufficientValue) return "INSUFFICIENT";
  if (value >= threshold) return "PASS";
  return "FAIL";
}

// ── Hint generation ──
//
// Every hint answers one question: "How do I get better evidence?"
// It does NOT answer "Why am I not the same person?"
// This distinction is critical — hints are about sensor acquisition, not identity.

const HINT_CATALOG: Record<string, Record<string, string>> = {
  IMU_PES: {
    FAIL: "Try moving more briskly — subtle motions lack enough entropy for a clear signal.",
    INSUFFICIENT: "No IMU data detected. Ensure your device has motion sensors and you're on HTTPS.",
  },
  Camera_PES: {
    FAIL: "Try moving your hand in a larger arc — the camera needs more visual variation.",
    INSUFFICIENT: "Camera couldn't track your hand. Ensure good lighting and keep your wrist visible.",
  },
  IMU_Similarity: {
    FAIL: "Your current motion doesn't match the enrolled pattern. Try repeating the exact same gesture.",
    INSUFFICIENT: "Not enough IMU data to compare. Try a longer capture duration.",
  },
  Camera_Similarity: {
    FAIL: "Visual motion differs from enrollment. Match the speed and path of your original gesture.",
    INSUFFICIENT: "Not enough camera frames to compare. Ensure your hand stays in frame.",
  },
  EventDensity: {
    FAIL: "Motion is too subtle — fewer detectable events than needed. Move with more pronounced changes.",
    INSUFFICIENT: "No motion events detected in either sensor. Try more dynamic movements.",
  },
  TemporalAlignment: {
    FAIL: "IMU and camera events don't align in time. Move the device and your hand together as one unit.",
    INSUFFICIENT: "Not enough events to check temporal coupling. Increase motion intensity.",
  },
  DirectionAgreement: {
    FAIL: "Hand direction doesn't match device motion. Hold the device in the hand you're moving.",
    INSUFFICIENT: "No matched event pairs to check direction. Ensure both sensors are active.",
  },
  CausalEvidence: {
    FAIL: "Weak causal coupling — the two sensors may not describe the same physical event.",
    INSUFFICIENT: "Insufficient data for causal analysis. Try longer, more dynamic motion.",
  },
};

/**
 * Generate an actionable hint for a component based on its metric and status.
 * Returns undefined for PASS status — no guidance needed.
 * Hint is about evidence ACQUISITION, not continuity interpretation.
 */
export function computeHint(metric: string, status: EvidenceStatus): string | undefined {
  if (status === "PASS") return undefined;
  return HINT_CATALOG[metric]?.[status];
}

// ── Evidence Digest ──

/**
 * Compute SHA-256 evidenceDigest over the evidence-bearing fields only:
 * timestamp + engineId + components.
 *
 * Diagnostics are deliberately EXCLUDED — they are human-readable strings
 * that change with wording improvements. The evidence values stay the same.
 *
 * Uses Web Crypto API — only available in secure contexts (HTTPS/localhost).
 * Returns empty string as fallback (non-HTTPS, SSR).
 *
 * Naming: called "evidenceDigest" to disambiguate from future hashes
 * (receiptHash, chainHash, merkleRoot, receiptSignature).
 */
export async function hashEvidence(evidence: EngineEvidence): Promise<string> {
  // Only evidence-bearing fields — NOT diagnostics
  const payload = JSON.stringify({
    engineId: evidence.engineId,
    timestamp: evidence.timestamp,
    components: evidence.components,
  });

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return "";
  }
}
