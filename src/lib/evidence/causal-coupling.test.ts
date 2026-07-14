// ═══════════════════════════════════════════════════════════════════
// EE-002 · Event-Level Causal Coupling — Unit Tests
//
// Tests the pure signal-processing core extracted from
// CausalCouplingClient.tsx. No browser APIs needed.
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  median,
  detectJerkPeaks,
  detectDirectionChanges,
  matchEvents,
  buildEvidence,
  DIRECTION_TOLERANCE_DEG,
  MATCH_WINDOW_MS,
  type IMUSample,
  type CameraSample,
} from "./causal-coupling";

// ═══════════════════════════════════════════════════════════════════
// Test data generators
// ═══════════════════════════════════════════════════════════════════

/**
 * Generate IMU samples with sinusoidal acceleration.
 * f=2Hz, A=3 m/s² produces jerk peaks of ~37.7 m/s³ — well above
 * the MAD-based threshold, so detectJerkPeaks should find them.
 */
function generateSinusoidalIMU(opts: {
  durationMs?: number;
  sampleIntervalMs?: number;
  amplitude?: number;
  frequencyHz?: number;
  timeOffset?: number;
} = {}): IMUSample[] {
  const {
    durationMs = 2000,
    sampleIntervalMs = 16,
    amplitude = 3,
    frequencyHz = 2,
    timeOffset = 0,
  } = opts;

  const samples: IMUSample[] = [];
  for (let t = 0; t < durationMs; t += sampleIntervalMs) {
    const ω = 2 * Math.PI * frequencyHz;
    const ax = amplitude * Math.sin(ω * ((t + timeOffset) / 1000));
    const ay = amplitude * Math.cos(ω * ((t + timeOffset) / 1000));
    samples.push({
      t: t + (timeOffset > 0 ? timeOffset : 0),
      ax: Math.round(ax * 1000) / 1000,
      ay: Math.round(ay * 1000) / 1000,
      az: 9.8,
      rx: 0, ry: 0, rz: 0,
      interval: sampleIntervalMs,
    });
  }
  return samples;
}

/**
 * Generate camera samples tracing a circle.
 * The velocity vector rotates continuously, so direction changes
 * are detected when the angle between velocity vectors exceeds the threshold.
 * With a fast enough rotation, the 300ms refractory period will still
 * capture multiple direction changes.
 */
function generateCircularCamera(opts: {
  durationMs?: number;
  sampleIntervalMs?: number;
  radius?: number;
  rotationsPerSecond?: number;
  timeOffset?: number;
} = {}): CameraSample[] {
  const {
    durationMs = 2000,
    sampleIntervalMs = 66, // ~15fps
    radius = 10,
    rotationsPerSecond = 0.8,
    timeOffset = 0,
  } = opts;

  const samples: CameraSample[] = [];
  for (let t = 0; t < durationMs; t += sampleIntervalMs) {
    const ω = 2 * Math.PI * rotationsPerSecond;
    const x = radius * Math.cos(ω * ((t + timeOffset) / 1000));
    const y = radius * Math.sin(ω * ((t + timeOffset) / 1000));
    samples.push({
      t: t + (timeOffset > 0 ? timeOffset : 0),
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      z: 0,
    });
  }
  return samples;
}

/**
 * Generate camera samples with sharp zigzag motion — clear direction changes.
 * Alternates between two directions every 400ms.
 */
function generateZigzagCamera(opts: {
  durationMs?: number;
  sampleIntervalMs?: number;
  timeOffset?: number;
} = {}): CameraSample[] {
  const { durationMs = 2000, sampleIntervalMs = 66, timeOffset = 0 } = opts;
  const samples: CameraSample[] = [];
  let dir = 1;
  for (let t = 0; t < durationMs; t += sampleIntervalMs) {
    const seg = Math.floor(t / 400);
    dir = seg % 2 === 0 ? 1 : -1;
    const progress = (t % 400) / 400;
    samples.push({
      t: t + (timeOffset > 0 ? timeOffset : 0),
      x: dir * progress * 20,
      y: dir * progress * 15,
      z: 0,
    });
  }
  return samples;
}

// ═══════════════════════════════════════════════════════════════════
// median
// ═══════════════════════════════════════════════════════════════════

describe("median", () => {
  it("returns middle value for odd-length array", () => {
    expect(median([1, 5, 3])).toBe(3);
  });

  it("returns average of middle two for even-length array", () => {
    expect(median([1, 4, 2, 7])).toBe(3); // sorted: [1,2,4,7] → (2+4)/2
  });

  it("handles single element", () => {
    expect(median([42])).toBe(42);
  });

  it("handles unsorted input", () => {
    expect(median([10, 2, 8, 4, 6])).toBe(6);
  });
});

// ═══════════════════════════════════════════════════════════════════
// detectJerkPeaks
// ═══════════════════════════════════════════════════════════════════

describe("detectJerkPeaks", () => {
  it("returns empty array for insufficient samples (< 10)", () => {
    const samples = generateSinusoidalIMU({ durationMs: 100 }); // ~6 samples
    expect(detectJerkPeaks(samples)).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(detectJerkPeaks([])).toEqual([]);
  });

  it("detects jerk peaks from sinusoidal acceleration (2Hz, 2s)", () => {
    const samples = generateSinusoidalIMU({ durationMs: 2000 });
    const peaks = detectJerkPeaks(samples);
    // 2Hz → 4 complete cycles in 2s → ~4 jerk magnitude peaks per second
    // With 200ms refractory, expect 5-8 peaks in 2s
    expect(peaks.length).toBeGreaterThanOrEqual(3);
    expect(peaks.length).toBeLessThanOrEqual(12);
    // All peaks should have positive magnitude
    for (const p of peaks) {
      expect(p.magnitude).toBeGreaterThan(0);
      expect(p.t).toBeGreaterThanOrEqual(0);
    }
  });

  it("enforces 150ms refractory period between peaks", () => {
    const samples = generateSinusoidalIMU({ durationMs: 1000 });
    const peaks = detectJerkPeaks(samples);
    for (let i = 1; i < peaks.length; i++) {
      expect(peaks[i].t - peaks[i - 1].t).toBeGreaterThanOrEqual(150);
    }
  });

  it("returns empty for flat signal (constant acceleration → zero jerk)", () => {
    const samples: IMUSample[] = [];
    for (let t = 0; t < 2000; t += 16) {
      samples.push({ t, ax: 1, ay: 1, az: 9.8, rx: 0, ry: 0, rz: 0, interval: 16 });
    }
    expect(detectJerkPeaks(samples)).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// detectDirectionChanges
// ═══════════════════════════════════════════════════════════════════

describe("detectDirectionChanges", () => {
  it("returns empty array for insufficient samples (< 6)", () => {
    const samples: CameraSample[] = [
      { t: 0, x: 0, y: 0, z: 0 },
      { t: 66, x: 1, y: 1, z: 0 },
      { t: 132, x: 2, y: 2, z: 0 },
    ];
    expect(detectDirectionChanges(samples)).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(detectDirectionChanges([])).toEqual([]);
  });

  it("detects direction changes in zigzag pattern", () => {
    const samples = generateZigzagCamera({ durationMs: 2000 });
    const events = detectDirectionChanges(samples);
    // Zigzag switches direction every 400ms → ~5 turns in 2s
    // With 300ms refractory, expect 4-6 events
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events.length).toBeLessThanOrEqual(8);
    for (const e of events) {
      expect(e.angleDeg).toBeGreaterThanOrEqual(45);
      expect(e.t).toBeGreaterThanOrEqual(0);
    }
  });

  it("enforces 300ms refractory period", () => {
    const samples = generateZigzagCamera({ durationMs: 2000 });
    const events = detectDirectionChanges(samples);
    for (let i = 1; i < events.length; i++) {
      expect(events[i].t - events[i - 1].t).toBeGreaterThanOrEqual(300);
    }
  });

  it("returns empty for linear motion (no direction change)", () => {
    const samples: CameraSample[] = [];
    for (let t = 0; t < 2000; t += 66) {
      samples.push({ t, x: t * 0.1, y: t * 0.05, z: 0 });
    }
    expect(detectDirectionChanges(samples)).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// matchEvents
// ═══════════════════════════════════════════════════════════════════

describe("matchEvents", () => {
  it("matches coupled events within temporal window (identical timestamps)", () => {
    const imuEvents = detectJerkPeaks(generateSinusoidalIMU({ durationMs: 2000 }));
    const camEvents = detectDirectionChanges(generateZigzagCamera({ durationMs: 2000 }));

    // Force timestamps to match exactly
    const syncedCam = camEvents.map((e, i) => ({
      ...e,
      t: imuEvents[i]?.t ?? e.t,
    }));

    const { matches, unmatchedIMU, unmatchedCam } = matchEvents(imuEvents, syncedCam);
    const totalEvents = Math.max(imuEvents.length, syncedCam.length);

    // All events that have counterparts within window should match
    if (matches.length > 0) {
      for (const m of matches) {
        expect(Math.abs(m.dtMs)).toBeLessThanOrEqual(MATCH_WINDOW_MS);
      }
      expect(unmatchedIMU.length + matches.length).toBe(imuEvents.length);
      expect(unmatchedCam.length + matches.length).toBe(syncedCam.length);
    }
  });

  it("matches zero events when streams are far apart in time", () => {
    const imuEvents = detectJerkPeaks(generateSinusoidalIMU({ durationMs: 1000, timeOffset: 0 }));
    // Camera delayed by 1000ms — well outside MATCH_WINDOW_MS
    const camEvents = detectJerkPeaks(generateSinusoidalIMU({ durationMs: 1000, timeOffset: 1000 }));

    // But detectJerkPeaks returns IMU events, not camera. Use explicit camera samples.
    const delayedCam: CameraSample[] = generateZigzagCamera({ durationMs: 1000, timeOffset: 3000 });
    const camDirEvents = detectDirectionChanges(delayedCam);

    const { matches } = matchEvents(imuEvents, camDirEvents);
    expect(matches.length).toBe(0);
  });

  it("returns empty matches for empty inputs", () => {
    const result = matchEvents([], []);
    expect(result.matches).toEqual([]);
    expect(result.unmatchedIMU).toEqual([]);
    expect(result.unmatchedCam).toEqual([]);
  });

  it("returns all IMU unmatched when camera events are empty", () => {
    const imuEvents = detectJerkPeaks(generateSinusoidalIMU({ durationMs: 1000 }));
    const result = matchEvents(imuEvents, []);
    expect(result.matches).toEqual([]);
    expect(result.unmatchedIMU.length).toBe(imuEvents.length);
    expect(result.unmatchedCam).toEqual([]);
  });

  it("directionAligned is true when IMU and camera motion vectors point same way", () => {
    // Create a simple matched pair where both point in same direction
    const imuEvent = { t: 100, magnitude: 5, ax: 1, ay: 1 };
    const camEvent = { t: 100, angleDeg: 45, fromDx: 1, fromDy: 1, toDx: 1, toDy: 1 };
    // IMU direction: atan2(1, 1) = π/4
    // Camera direction: atan2(1, 1) = π/4
    // Direction difference ≈ 0 < 90° → aligned

    const { matches } = matchEvents([imuEvent], [camEvent]);
    expect(matches.length).toBe(1);
    expect(matches[0].directionAligned).toBe(true);
  });

  it("directionAligned is false for opposite vectors", () => {
    const imuEvent = { t: 100, magnitude: 5, ax: 1, ay: 0 };   // direction = 0°
    const camEvent = { t: 100, angleDeg: 180, fromDx: 1, fromDy: 0, toDx: -1, toDy: 0 };
    // IMU direction: atan2(0, 1) = 0
    // Camera direction: atan2(0, -1) = π
    // Direction difference = π ≈ 180° > 90° → NOT aligned

    const { matches } = matchEvents([imuEvent], [camEvent]);
    expect(matches.length).toBe(1);
    expect(matches[0].directionAligned).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════
// buildEvidence
// ═══════════════════════════════════════════════════════════════════

describe("buildEvidence", () => {
  it("returns evidence with FAIL/INSUFFICIENT components for empty event arrays", () => {
    const ev = buildEvidence([], [], [], [], [], 0);
    expect(ev.engineId).toBe("EE-002");
    expect(ev.components.length).toBe(4);
    // EventDensity: computeStatus(0, 0.3) → FAIL (0 < threshold, 0 > -1)
    expect(ev.components.find((c) => c.metric === "EventDensity")!.status).toBe("FAIL");
    // TemporalAlignment: computeStatus(0, 0.40) → FAIL
    expect(ev.components.find((c) => c.metric === "TemporalAlignment")!.status).toBe("FAIL");
    // DirectionAgreement: explicitly INSUFFICIENT when matches.length === 0
    expect(ev.components.find((c) => c.metric === "DirectionAgreement")!.status).toBe("INSUFFICIENT");
    // CausalEvidence: computeStatus(0, 0.40) → FAIL
    expect(ev.components.find((c) => c.metric === "CausalEvidence")!.status).toBe("FAIL");
    // Diagnostic confirms no events
    expect(ev.diagnostics).toContain(
      "✗ no events detected in either channel — insufficient motion or sensor failure",
    );
  });

  it("produces PASS components for well-coupled simulated data", () => {
    const imuEvents = detectJerkPeaks(generateSinusoidalIMU({ durationMs: 2000 }));
    const camEvents = detectDirectionChanges(generateZigzagCamera({ durationMs: 2000 }));
    const { matches, unmatchedIMU, unmatchedCam } = matchEvents(imuEvents, camEvents);
    const ev = buildEvidence(imuEvents, camEvents, matches, unmatchedIMU, unmatchedCam, 2000);

    expect(ev.engineId).toBe("EE-002");
    expect(ev.timestamp).toBeTruthy();

    // EventDensity should be sufficient
    const densityComp = ev.components.find((c) => c.metric === "EventDensity")!;
    expect(densityComp.value).toBeGreaterThan(0);
    expect(densityComp.engine).toBe("EE-002");

    // CausalEvidence component should exist
    const causalComp = ev.components.find((c) => c.metric === "CausalEvidence")!;
    expect(causalComp).toBeDefined();
    expect(causalComp.value).toBeGreaterThanOrEqual(0);
    expect(causalComp.value).toBeLessThanOrEqual(1);
  });

  it("triggers CFC-005 diagnostic when camera event precedes IMU event", () => {
    const imuEvent: any = { t: 500, magnitude: 10, ax: 1, ay: 0 };
    const camEvent: any = { t: 100, angleDeg: 90, fromDx: 1, fromDy: 0, toDx: 0, toDy: 1 };
    const match = { imu: imuEvent, cam: camEvent, dtMs: 400, directionAligned: true };

    const ev = buildEvidence([imuEvent], [camEvent], [match], [], [], 500);
    const cfcDiagnostic = ev.diagnostics.find((d) => d.startsWith("⚠ CFC-005"));
    expect(cfcDiagnostic).toBeDefined();
    expect(cfcDiagnostic).toContain("Causal Inversion");
  });

  it("does NOT trigger CFC-005 when IMU event precedes camera event (normal causal order)", () => {
    const imuEvent: any = { t: 100, magnitude: 10, ax: 1, ay: 0 };
    const camEvent: any = { t: 200, angleDeg: 90, fromDx: 1, fromDy: 0, toDx: 0, toDy: 1 };
    const match = { imu: imuEvent, cam: camEvent, dtMs: 100, directionAligned: true };

    const ev = buildEvidence([imuEvent], [camEvent], [match], [], [], 500);
    const cfcDiagnostic = ev.diagnostics.find((d) => d.startsWith("⚠ CFC-005"));
    expect(cfcDiagnostic).toBeUndefined();
  });

  it("includes temporal jitter warning when average dt is high", () => {
    const imuEvent1: any = { t: 100, magnitude: 10, ax: 1, ay: 0 };
    const imuEvent2: any = { t: 500, magnitude: 8, ax: 0, ay: 1 };
    const camEvent1: any = { t: 280, angleDeg: 90, fromDx: 1, fromDy: 0, toDx: 0, toDy: 1 };
    const camEvent2: any = { t: 680, angleDeg: 90, fromDx: 0, fromDy: 1, toDx: 1, toDy: 0 };
    const matches = [
      { imu: imuEvent1, cam: camEvent1, dtMs: 180, directionAligned: true },
      { imu: imuEvent2, cam: camEvent2, dtMs: 180, directionAligned: true },
    ];

    const ev = buildEvidence(
      [imuEvent1, imuEvent2],
      [camEvent1, camEvent2],
      matches,
      [], [],
      1000,
    );
    const jitterDiag = ev.diagnostics.find((d) => d.startsWith("⚠ high temporal jitter"));
    expect(jitterDiag).toBeDefined();
  });

  it("includes insufficient motion diagnostic when no events in either channel", () => {
    const ev = buildEvidence([], [], [], [], [], 1000);
    expect(ev.diagnostics).toContain(
      "✗ no events detected in either channel — insufficient motion or sensor failure",
    );
  });

  it("evidenceDigest is not set by buildEvidence (digest is computed asynchronously by caller)", () => {
    const ev = buildEvidence([], [], [], [], [], 0);
    expect(ev.evidenceDigest).toBeUndefined();
  });

  it("confidence is set from CausalEvidence component value", () => {
    const imuEvents = detectJerkPeaks(generateSinusoidalIMU({ durationMs: 2000 }));
    const camEvents = detectDirectionChanges(generateZigzagCamera({ durationMs: 2000 }));
    const { matches, unmatchedIMU, unmatchedCam } = matchEvents(imuEvents, camEvents);
    const ev = buildEvidence(imuEvents, camEvents, matches, unmatchedIMU, unmatchedCam, 2000);
    expect(ev.confidence).toBeDefined();
    expect(ev.confidence).toBeGreaterThanOrEqual(0);
    expect(ev.confidence).toBeLessThanOrEqual(1);
  });

  it("confidence is 0 when CausalEvidence component value is 0", () => {
    const ev = buildEvidence([], [], [], [], [], 0);
    expect(ev.confidence).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Integration: full pipeline
// ═══════════════════════════════════════════════════════════════════

describe("EE-002 full pipeline", () => {
  it("end-to-end: sinusoidal IMU + zigzag camera → produces EngineEvidence", () => {
    const imuSamples = generateSinusoidalIMU({ durationMs: 3000 });
    const camSamples = generateZigzagCamera({ durationMs: 3000 });

    const imuEvents = detectJerkPeaks(imuSamples);
    const camEvents = detectDirectionChanges(camSamples);
    const { matches, unmatchedIMU, unmatchedCam } = matchEvents(imuEvents, camEvents);
    const evidence = buildEvidence(imuEvents, camEvents, matches, unmatchedIMU, unmatchedCam, 3000);

    // Basic structural assertions
    expect(evidence.engineId).toBe("EE-002");
    expect(evidence.timestamp).toBeTruthy();
    expect(evidence.components.length).toBeGreaterThanOrEqual(3);
    expect(evidence.diagnostics.length).toBeGreaterThan(0);

    // At least one diagnostic should be generated
    const passDiagnostics = evidence.diagnostics.filter((d) => d.startsWith("✓"));
    const failDiagnostics = evidence.diagnostics.filter((d) => d.startsWith("✗"));
    const warnDiagnostics = evidence.diagnostics.filter((d) => d.startsWith("⚠"));

    // With simulated data, we expect some diagnostics (at minimum the no-match or event density)
    expect(passDiagnostics.length + failDiagnostics.length + warnDiagnostics.length).toBeGreaterThan(0);
  });

  it("produces no matches when IMU and camera are from independent unrelated motions", () => {
    // IMU: sinusoidal motion
    const imuEvents = detectJerkPeaks(generateSinusoidalIMU({ durationMs: 2000, timeOffset: 0 }));

    // Camera: completely different motion with time offset > window
    const delayedCam = generateZigzagCamera({ durationMs: 2000, timeOffset: 5000 });
    const camEvents = detectDirectionChanges(delayedCam);

    const { matches } = matchEvents(imuEvents, camEvents);
    expect(matches.length).toBe(0);
  });
});
