// ============================================================
// MyShape Protocol SDK v2 — Continuity Module
//
// Presence Stability Score (PSS) tracking over time.
// Answers: "Is this the same person, continuously present?"
//
// Built on presence-stream.ts concepts, but works with
// CPS-0001 ContinuityReceipt objects.
// ============================================================

import type { ContinuityReceipt } from "@/lib/evidence/cps0001";

// ── Public types ──

export type ContinuityTrend = "rising" | "stable" | "declining";

export interface ContinuityStatus {
  /** Presence Stability Score [0, 1] — how stable the presence has been */
  pss: number;
  /** Trend across the receipt window */
  trend: ContinuityTrend;
  /** Number of receipts analyzed */
  receiptCount: number;
  /** Duration covered (seconds) */
  durationSeconds: number;
  /** Whether continuity is maintained (PSS ≥ threshold) */
  isContinuous: boolean;
}

export interface ContinuityOptions {
  /** Minimum PSS to consider presence "continuous" (default 0.5) */
  minPss?: number;
  /** Minimum number of receipts for a meaningful PSS (default 3) */
  minReceipts?: number;
}

// ── Implementation ──

/**
 * Check continuity across a series of CPS-0001 receipts.
 *
 * Each receipt carries an engine confidence score (in its evidence blocks).
 * PSS = mean confidence × stability factor, where stability is
 * 1 − coefficient of variation across receipts.
 *
 * @returns ContinuityStatus or null if insufficient receipts.
 */
export function checkContinuity(
  receipts: ContinuityReceipt[],
  options: ContinuityOptions = {},
): ContinuityStatus | null {
  const { minPss = 0.5, minReceipts = 3 } = options;

  if (receipts.length < minReceipts) return null;

  // Extract confidence from each receipt's first evidence block
  const confidences = receipts.map((r) => r.evidence[0]?.confidence ?? 0);

  // Sort by time (use interval.start for ordering)
  const sorted = [...receipts].sort(
    (a, b) => new Date(a.interval.start).getTime() - new Date(b.interval.start).getTime(),
  );

  const firstReceipt = sorted[0];
  const lastReceipt = sorted[sorted.length - 1];
  const durationMs =
    new Date(lastReceipt.interval.end).getTime() -
    new Date(firstReceipt.interval.start).getTime();

  // Mean confidence
  const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;

  // Stability = 1 − coefficient of variation
  const variance =
    confidences.reduce((s, v) => s + (v - mean) ** 2, 0) / confidences.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
  const stability = Math.max(0, 1 - cv);

  // PSS = mean confidence × stability factor
  const pss = mean * (0.5 + 0.5 * stability);

  // Trend: compare first half vs second half
  const mid = Math.floor(confidences.length / 2);
  const firstHalf = confidences.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const secondHalf =
    confidences.slice(mid).reduce((a, b) => a + b, 0) / (confidences.length - mid);
  const delta = secondHalf - firstHalf;
  const trend: ContinuityTrend =
    delta > 0.03 ? "rising" : delta < -0.03 ? "declining" : "stable";

  return {
    pss,
    trend,
    receiptCount: receipts.length,
    durationSeconds: Math.round(durationMs / 1000),
    isContinuous: pss >= minPss,
  };
}
