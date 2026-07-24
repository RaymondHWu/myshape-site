// ============================================================
// MyShape Protocol — Presence Stream Engine (§11-13)
//
// §11 Receipt Aggregation — recursive receipts over time
// §12 Multi-Device Presence — fused receipts across devices
// §13 Continuous Presence — real-time presence stream + PSS
//
// Uses CPS-0001 ContinuityReceipt as the protocol object.
// ============================================================

import type { ContinuityReceipt } from "@/lib/evidence/cps0001";
import { sha256Hex } from "@/lib/hash";

// ── §11 — Aggregated Proof ──

export interface AggregatedProof {
  version: "1.1";
  window_count: number;
  receipts: ContinuityReceipt[];
  entropy_score: number;      // PES_agg (min confidence)
  timestamp_start: number;
  timestamp_end: number;
  root_hash: string;
}

export function aggregateProofs(
  receipts: ContinuityReceipt[],
  options: { max_gap_seconds?: number; min_entropy?: number } = {},
): AggregatedProof | null {
  const { max_gap_seconds = 3, min_entropy = 0.65 } = options;
  if (receipts.length === 0) return null;

  // Rule 1: Temporal continuity — gap between consecutive receipts ≤ max_gap
  const sorted = [...receipts].sort(
    (a, b) => new Date(a.interval.start).getTime() - new Date(b.interval.start).getTime(),
  );
  for (let i = 1; i < sorted.length; i++) {
    const gap =
      new Date(sorted[i].interval.start).getTime() / 1000 -
      new Date(sorted[i - 1].interval.end).getTime() / 1000;
    if (gap > max_gap_seconds) return null;
  }

  // Rule 2: Entropy preservation — aggregate confidence must meet threshold
  const confidences = sorted.map((r) => r.evidence[0]?.confidence ?? 0);
  const minConf = Math.min(...confidences);
  const avgConf = confidences.reduce((a, b) => a + b, 0) / confidences.length;
  const pesAgg = minConf; // conservative: use minimum
  if (pesAgg < min_entropy) return null;

  // Compute root hash from receipt IDs
  const hashInput = sorted.map((r) => r.receiptId).join(":") + `:avg=${avgConf.toFixed(4)}`;

  return {
    version: "1.1",
    window_count: sorted.length,
    receipts: sorted,
    entropy_score: pesAgg,
    timestamp_start: Math.floor(new Date(sorted[0].interval.start).getTime() / 1000),
    timestamp_end: Math.floor(new Date(sorted[sorted.length - 1].interval.end).getTime() / 1000),
    root_hash: sha256Hex(hashInput),
  };
}

// ── §12 — Multi-Device Presence ──

export type DeviceType = "headset" | "phone" | "watch" | "laptop" | "external_camera";

export interface DeviceProof {
  device_id: string;
  device_type: DeviceType;
  receipt: ContinuityReceipt;
  timestamp: number;
}

// §12.6 — Device weights
const DEVICE_WEIGHTS: Record<DeviceType, number> = {
  headset: 1.0,
  phone: 0.6,
  watch: 0.3,
  laptop: 0.5,
  external_camera: 0.7,
};

export interface MultiDevicePresence {
  devices: DeviceProof[];
  fused_pes: number;
  fused_timestamp: number;
  device_count: number;
}

export function fuseMultiDevicePresence(
  deviceProofs: DeviceProof[],
  options: { sync_tolerance_ms?: number } = {},
): MultiDevicePresence | null {
  const { sync_tolerance_ms = 50 } = options;
  if (deviceProofs.length === 0) return null;

  // Device synchronization: all timestamps within tolerance
  const timestamps = deviceProofs.map((d) => d.timestamp);
  const maxTs = Math.max(...timestamps);
  const minTs = Math.min(...timestamps);
  if (maxTs - minTs > sync_tolerance_ms / 1000) return null;

  // Weighted entropy fusion (use evidence confidence as PES)
  let totalWeight = 0;
  let weightedPes = 0;
  for (const dp of deviceProofs) {
    const w = DEVICE_WEIGHTS[dp.device_type] ?? 0.5;
    weightedPes += (dp.receipt.evidence[0]?.confidence ?? 0) * w;
    totalWeight += w;
  }

  return {
    devices: deviceProofs,
    fused_pes: totalWeight > 0 ? weightedPes / totalWeight : 0,
    fused_timestamp: Math.floor((minTs + maxTs) / 2 * 1000) / 1000,
    device_count: deviceProofs.length,
  };
}

// ── §13 — Continuous Presence Stream ──

export interface PresenceSnapshot {
  receipt: ContinuityReceipt;
  pes: number;
  timestamp: number;
}

export interface PresenceStream {
  snapshots: PresenceSnapshot[];
  start_time: number;
  duration_seconds: number;
  sample_count: number;
  pss: number;
  pss_trend: "rising" | "stable" | "declining";
}

// §13 — Presence Stability Score

export function computePresenceStabilityScore(
  snapshots: PresenceSnapshot[],
): { pss: number; trend: PresenceStream["pss_trend"] } {
  if (snapshots.length < 3) {
    return { pss: snapshots.length > 0 ? snapshots[0].pes : 0, trend: "stable" };
  }

  const pesValues = snapshots.map((s) => s.pes);
  const mean = pesValues.reduce((a, b) => a + b, 0) / pesValues.length;

  const variance = pesValues.reduce((s, v) => s + (v - mean) ** 2, 0) / pesValues.length;
  const cv = mean > 0 ? Math.sqrt(variance) / mean : 1;
  const stability = Math.max(0, 1 - cv);

  const pss = mean * (0.5 + 0.5 * stability);

  const mid = Math.floor(pesValues.length / 2);
  const firstHalf = pesValues.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const secondHalf =
    pesValues.slice(mid).reduce((a, b) => a + b, 0) / (pesValues.length - mid);
  const delta = secondHalf - firstHalf;
  const trend: PresenceStream["pss_trend"] =
    delta > 0.03 ? "rising" : delta < -0.03 ? "declining" : "stable";

  return { pss, trend };
}

export function createPresenceStream(
  snapshots: PresenceSnapshot[],
): PresenceStream | null {
  if (snapshots.length === 0) return null;

  const sorted = [...snapshots].sort((a, b) => a.timestamp - b.timestamp);
  const { pss, trend } = computePresenceStabilityScore(sorted);

  return {
    snapshots: sorted,
    start_time: sorted[0].timestamp,
    duration_seconds: sorted[sorted.length - 1].timestamp - sorted[0].timestamp,
    sample_count: sorted.length,
    pss,
    pss_trend: trend,
  };
}
