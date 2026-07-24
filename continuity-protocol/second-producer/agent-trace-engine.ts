/**
 * EE-002 — Agent Execution Trace Engine
 *
 * Proves: an AI agent (or any software process) was continuously
 * running during a time window, with no gaps, crashes, or anomalies.
 *
 * Input:  timestamped system state snapshots
 * Output: CPS-0001 EvidenceBlock
 *
 * Zero MyShape dependencies. Only @noble/hashes.
 *
 * This is a SECOND real evidence type, completely different from PES:
 *   - No sensor hardware
 *   - No biological sensor
 *   - No camera or IMU
 *   - Pure software trace
 *
 * The point: CPS-0001 does not care what evidence is.
 */

import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";

function sha256Hex(data: string): string {
  return bytesToHex(sha256(new TextEncoder().encode(data)));
}

// ── Types ──

export interface TraceSnapshot {
  /** Unix millisecond timestamp */
  timestamp: number;
  /** Process count */
  processCount?: number;
  /** Memory usage in MB */
  memoryMB?: number;
  /** CPU percentage */
  cpuPercent?: number;
  /** Custom key-value metrics */
  metrics?: Record<string, number>;
}

export interface TraceAnalysis {
  temporalDensity: number;    // [0,1] — how evenly spaced are samples?
  valueStability: number;     // [0,1] — absent of sudden jumps?
  coverageScore: number;      // [0,1] — long enough to be meaningful?
  avgIntervalMs: number;
  totalSnapshots: number;
}

// ── Engine ──

/**
 * Analyze an agent execution trace.
 *
 * Confidence = f(temporalDensity × valueStability × coverageScore)
 *
 * A high-confidence trace has:
 *   - Regular sample intervals (no suspicious gaps)
 *   - Gradual value changes (no sudden skips from crash/restart)
 *   - Sufficient duration (≥30 seconds)
 */
export function analyzeTrace(snapshots: TraceSnapshot[]): {
  analysis: TraceAnalysis;
  evidence: {
    engineId: string;
    engineVersion: string;
    confidence: number;
    payload: Record<string, unknown>;
    payloadDigest: string;
  };
} {
  if (snapshots.length < 5) {
    throw new Error("Need at least 5 snapshots for meaningful analysis");
  }

  // Sort by timestamp
  const sorted = [...snapshots].sort((a, b) => a.timestamp - b.timestamp);
  const n = sorted.length;

  // 1. Temporal density — how regularly spaced?
  const intervals: number[] = [];
  for (let i = 1; i < n; i++) {
    intervals.push(sorted[i].timestamp - sorted[i - 1].timestamp);
  }
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const maxGap = Math.max(...intervals);
  // Score: 1.0 = perfectly regular, drops as gaps appear
  const temporalDensity = Math.min(1, avgInterval / Math.max(maxGap, 1));

  // 2. Value stability — no sudden jumps?
  const memValues = sorted.map((s) => s.memoryMB ?? 0).filter((v) => v > 0);
  let stabilityScore = 1.0;
  if (memValues.length >= 3) {
    const diffs: number[] = [];
    for (let i = 1; i < memValues.length; i++) {
      diffs.push(Math.abs(memValues[i] - memValues[i - 1]));
    }
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const maxDiff = Math.max(...diffs);
    stabilityScore = maxDiff > 0 ? 1 - Math.min(1, (maxDiff - avgDiff) / Math.max(maxDiff, 1)) : 1;
  }

  // 3. Coverage — long enough?
  const durationMs = sorted[n - 1].timestamp - sorted[0].timestamp;
  const coverageScore = Math.min(1, durationMs / 30_000); // 1.0 at ≥30 seconds

  // Combined confidence
  const confidence = temporalDensity * 0.4 + stabilityScore * 0.3 + coverageScore * 0.3;

  const analysis: TraceAnalysis = {
    temporalDensity,
    valueStability: stabilityScore,
    coverageScore,
    avgIntervalMs: Math.round(avgInterval),
    totalSnapshots: n,
  };

  const payload = {
    snapshots: sorted.map((s) => ({
      t: s.timestamp,
      p: s.processCount ?? null,
      m: s.memoryMB ?? null,
      c: s.cpuPercent ?? null,
      x: s.metrics ?? null,
    })),
    analysis: { ...analysis },
  };

  const payloadDigest = sha256Hex(JSON.stringify(payload));

  return {
    analysis,
    evidence: {
      engineId: "EE-002",
      engineVersion: "1.0.0",
      confidence: Math.round(confidence * 100) / 100,
      payload,
      payloadDigest,
    },
  };
}
