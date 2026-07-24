import { describe, it, expect } from "vitest";
import {
  aggregateProofs,
  fuseMultiDevicePresence,
  computePresenceStabilityScore,
  createPresenceStream,
} from "./presence-stream";
import { buildReceipt, computePayloadDigest, type ContinuityReceipt } from "@/lib/evidence/cps0001";
import type { PresenceSnapshot, DeviceProof } from "./presence-stream";
import { sha256Hex } from "@/lib/hash";

// ── Helpers ──

const BASE_TIME = Date.now();

function makeReceipt(confidence: number, offsetSeconds: number): ContinuityReceipt {
  const start = new Date(BASE_TIME + offsetSeconds * 1000);
  const end = new Date(BASE_TIME + offsetSeconds * 1000 + 1000); // 1s window
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
    subject: { id: sha256Hex("test-device"), type: "embodied" },
    issuer: { id: sha256Hex("issuer:salt"), publicKey: sha256Hex("pk:salt") },
  });

  const r = {
    ...unsigned,
    signature: {
      algorithm: "placeholder",
      value: sha256Hex(unsigned.receiptId + "issuer"),
      signedAt: end.toISOString(),
    },
  } as ContinuityReceipt;

  return r;
}

function makeSnapshot(pes: number, timestamp: number): PresenceSnapshot {
  return {
    receipt: makeReceipt(pes, timestamp),
    pes,
    timestamp,
  };
}

// ── aggregateProofs (§11) ──

describe("aggregateProofs", () => {
  it("returns null for empty array", () => {
    expect(aggregateProofs([])).toBeNull();
  });

  it("aggregates continuous receipts with sufficient entropy", () => {
    const receipts = [
      makeReceipt(0.70, 0),
      makeReceipt(0.72, 1),
      makeReceipt(0.75, 2),
    ];
    const result = aggregateProofs(receipts);
    expect(result).not.toBeNull();
    expect(result!.window_count).toBe(3);
    expect(result!.entropy_score).toBe(0.70); // min confidence (security-first)
    expect(result!.version).toBe("1.1");
  });

  it("rejects receipts with temporal gap > max_gap", () => {
    const receipts = [
      makeReceipt(0.70, 0),
      makeReceipt(0.72, 10), // 9s gap > 3s default
    ];
    expect(aggregateProofs(receipts)).toBeNull();
  });

  it("rejects receipts with confidence below min_entropy", () => {
    const receipts = [
      makeReceipt(0.70, 0),
      makeReceipt(0.60, 1), // below 0.65 default
    ];
    const result = aggregateProofs(receipts);
    expect(result).toBeNull();
  });

  it("sorts receipts by time before processing", () => {
    const receipts = [
      makeReceipt(0.75, 2),
      makeReceipt(0.70, 0),
      makeReceipt(0.72, 1),
    ];
    const result = aggregateProofs(receipts);
    expect(result).not.toBeNull();
    expect(result!.entropy_score).toBe(0.70); // min of [0.70, 0.72, 0.75]
  });

  it("custom max_gap_seconds option works", () => {
    const receipts = [
      makeReceipt(0.70, 0),
      makeReceipt(0.72, 6), // 5s gap, but we allow 10s
    ];
    const result = aggregateProofs(receipts, { max_gap_seconds: 10 });
    expect(result).not.toBeNull();
  });

  it("generates unique root hash", () => {
    const p1 = aggregateProofs([makeReceipt(0.70, 0), makeReceipt(0.71, 1)]);
    const p2 = aggregateProofs([makeReceipt(0.70, 0), makeReceipt(0.71, 1)]);
    expect(p1!.root_hash).not.toBe(p2!.root_hash);
  });
});

// ── fuseMultiDevicePresence (§12) ──

describe("fuseMultiDevicePresence", () => {
  function makeDevice(deviceType: string, confidence: number, offsetSeconds: number): DeviceProof {
    return {
      device_id: `dev-${deviceType}`,
      device_type: deviceType as DeviceProof["device_type"],
      receipt: makeReceipt(confidence, offsetSeconds),
      timestamp: BASE_TIME / 1000 + offsetSeconds,
    };
  }

  it("returns null for empty devices", () => {
    expect(fuseMultiDevicePresence([])).toBeNull();
  });

  it("fuses single device with its full weight", () => {
    const result = fuseMultiDevicePresence([makeDevice("headset", 0.80, 0)]);
    expect(result).not.toBeNull();
    expect(result!.fused_pes).toBeCloseTo(0.80, 2);
    expect(result!.device_count).toBe(1);
  });

  it("computes weighted PES across device types", () => {
    const devices = [
      makeDevice("headset", 0.90, 0),   // weight 1.0
      makeDevice("phone", 0.60, 0),      // weight 0.6
    ];
    const result = fuseMultiDevicePresence(devices);
    expect(result).not.toBeNull();
    // Weighted: (0.90*1.0 + 0.60*0.6) / 1.6 = 1.26/1.6 = 0.7875
    expect(result!.fused_pes).toBeCloseTo(0.7875, 2);
  });

  it("rejects unsynchronized devices", () => {
    const devices = [
      makeDevice("headset", 0.80, 0),
      makeDevice("phone", 0.70, 1), // 1s gap > 50ms default
    ];
    expect(fuseMultiDevicePresence(devices)).toBeNull();
  });

  it("custom sync_tolerance_ms works", () => {
    const devices = [
      makeDevice("headset", 0.80, 0),
      makeDevice("phone", 0.70, 0.5), // 0.5s = 500ms
    ];
    const result = fuseMultiDevicePresence(devices, { sync_tolerance_ms: 1000 });
    expect(result).not.toBeNull();
  });
});

// ── computePresenceStabilityScore (§13) ──

describe("computePresenceStabilityScore", () => {
  it("returns PES for single snapshot", () => {
    const result = computePresenceStabilityScore([makeSnapshot(0.75, 1000)]);
    expect(result.pss).toBeCloseTo(0.75, 2);
    expect(result.trend).toBe("stable");
  });

  it("high stability for consistent PES values", () => {
    const snapshots = [
      makeSnapshot(0.75, 1000),
      makeSnapshot(0.76, 1001),
      makeSnapshot(0.74, 1002),
      makeSnapshot(0.75, 1003),
    ];
    const result = computePresenceStabilityScore(snapshots);
    expect(result.pss).toBeGreaterThan(0.6);
    expect(result.trend).toBe("stable");
  });

  it("low stability for volatile PES values", () => {
    const snapshots = [
      makeSnapshot(0.90, 1000),
      makeSnapshot(0.20, 1001),
      makeSnapshot(0.85, 1002),
      makeSnapshot(0.15, 1003),
    ];
    const result = computePresenceStabilityScore(snapshots);
    expect(result.pss).toBeLessThan(0.5);
  });

  it("detects rising trend", () => {
    const snapshots = [
      makeSnapshot(0.50, 1000),
      makeSnapshot(0.55, 1001),
      makeSnapshot(0.60, 1002),
      makeSnapshot(0.65, 1003),
    ];
    const result = computePresenceStabilityScore(snapshots);
    expect(result.trend).toBe("rising");
  });

  it("detects declining trend", () => {
    const snapshots = [
      makeSnapshot(0.70, 1000),
      makeSnapshot(0.65, 1001),
      makeSnapshot(0.60, 1002),
      makeSnapshot(0.55, 1003),
    ];
    const result = computePresenceStabilityScore(snapshots);
    expect(result.trend).toBe("declining");
  });
});

// ── createPresenceStream (§13) ──

describe("createPresenceStream", () => {
  it("returns null for empty snapshots", () => {
    expect(createPresenceStream([])).toBeNull();
  });

  it("creates stream from snapshots sorted by timestamp", () => {
    const snapshots = [
      makeSnapshot(0.75, 1002),
      makeSnapshot(0.70, 1000),
      makeSnapshot(0.72, 1001),
    ];
    const stream = createPresenceStream(snapshots);
    expect(stream).not.toBeNull();
    expect(stream!.start_time).toBe(1000);
    expect(stream!.sample_count).toBe(3);
    expect(stream!.duration_seconds).toBe(2);
    expect(stream!.pss).toBeGreaterThan(0);
    expect(["rising", "stable", "declining"]).toContain(stream!.pss_trend);
  });
});
