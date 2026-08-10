// ============================================================
// MyShape Protocol — Synthetic Motion Generators
//
// Shared generators used by the PES benchmarks:
//   - generateHumanFrames  → human-like motion with biological noise
//   - generateAIFrames     → smooth random-walk (no tremor/no coordination)
//   - generateReplayFrames → exact human copy w/ uniform replay timing
//
// These were extracted from pes-benchmark.test.ts so both the
// classic benchmark and the ROC/AUC benchmark share one source
// of truth. Constant values (amplitude, jitter, etc.) are
// intentionally preserved verbatim for reproducibility.
// ============================================================

import type { JointPosition } from "@/types/motion-vector";

export const FPS = 30;
export const DURATION_SEC = 2; // §2.4: 1–2 second PES window
export const FRAME_COUNT = FPS * DURATION_SEC;
export const SST_JOINTS = 18;

/** Base sinusoidal motion for a joint — simulates natural body movement */
function humanJointSignal(t: number, jointIdx: number): number {
  const amplitude = 0.3 + (jointIdx % 5) * 0.08;
  const freq = 0.8 + (jointIdx % 3) * 0.4;
  // Multiple frequency components + phase offsets for complexity
  return (
    amplitude * Math.sin(2 * Math.PI * freq * t + jointIdx * 0.7) +
    amplitude * 0.4 * Math.sin(2 * Math.PI * freq * 2.3 * t + jointIdx * 1.3) +
    amplitude * 0.15 * Math.sin(2 * Math.PI * freq * 5.1 * t + jointIdx * 2.1)
  );
}

/** Generate human-like motion frames with biological noise */
export function generateHumanFrames(count: number): {
  frames: Array<Record<number, JointPosition>>;
  timestamps: number[];
} {
  const frames: Array<Record<number, JointPosition>> = [];
  const timestamps: number[] = [];
  const baseInterval = 1000 / FPS;

  for (let i = 0; i < count; i++) {
    const t = i / FPS;
    // Human micro-timing: 28–38ms jitter around 33.33ms base
    const jitter = (Math.sin(i * 0.7) * 5 + (Math.random() - 0.5) * 6);
    const ts = i === 0 ? 0 : timestamps[i - 1] + baseInterval + jitter;
    timestamps.push(Math.max(0, ts));

    const frame: Record<number, JointPosition> = {};
    for (let j = 0; j < SST_JOINTS; j++) {
      // Biological tremor: small high-frequency noise on each joint
      const tremor = (Math.random() - 0.5) * 0.015;
      // Coordinated jerk: all joints share underlying movement pattern
      const coordinated = humanJointSignal(t, j);
      // Individual joint noise
      const noise = (Math.random() - 0.5) * 0.008;

      frame[j] = {
        x: coordinated + tremor + noise,
        y: humanJointSignal(t + 0.3, j + 10) + tremor + noise,
        z: humanJointSignal(t + 0.6, j + 20) * 0.5 + tremor,
      };
    }
    frames.push(frame);
  }

  return { frames, timestamps };
}

/** AI motion: random-walk interpolation — smooth, no tremor, joints move independently */
export function generateAIFrames(count: number): {
  frames: Array<Record<number, JointPosition>>;
  timestamps: number[];
} {
  const frames: Array<Record<number, JointPosition>> = [];
  const timestamps: number[] = [];
  const baseInterval = 1000 / FPS;
  const stepSize = 0.015; // small smooth step per frame

  // Initialize per-joint positions (random starts)
  const positions: Array<{ x: number; y: number; z: number }> = [];
  for (let j = 0; j < SST_JOINTS; j++) {
    positions.push({ x: (Math.random() - 0.5) * 0.6, y: (Math.random() - 0.5) * 0.6, z: (Math.random() - 0.5) * 0.3 });
  }

  for (let i = 0; i < count; i++) {
    // AI timing: near-perfect 33.33ms intervals
    timestamps.push(i * baseInterval + (Math.random() - 0.5) * 1.0);

    const frame: Record<number, JointPosition> = {};
    for (let j = 0; j < SST_JOINTS; j++) {
      // Random walk with slight drift back to center — smooth, no tremor
      const pos = positions[j];
      pos.x += (Math.random() - 0.5) * stepSize - pos.x * 0.002;
      pos.y += (Math.random() - 0.5) * stepSize - pos.y * 0.002;
      pos.z += (Math.random() - 0.5) * stepSize * 0.5 - pos.z * 0.002;

      frame[j] = { x: pos.x, y: pos.y, z: pos.z };
    }
    frames.push(frame);
  }

  return { frames, timestamps };
}

/** Generate replay-attack frames — exact copy of human frames, synthetic uniform timing */
export function generateReplayFrames(original: {
  frames: Array<Record<number, JointPosition>>;
  timestamps: number[];
}): {
  frames: Array<Record<number, JointPosition>>;
  timestamps: number[];
} {
  const frames = original.frames.map(f => {
    const copy: Record<number, JointPosition> = {};
    for (const key of Object.keys(f)) {
      const j = f[Number(key)];
      copy[Number(key)] = { x: j.x, y: j.y, z: j.z };
    }
    return copy;
  });

  // Replay attack: perfect uniform 33.33ms timing
  const timestamps = frames.map((_, i) => i * (1000 / FPS));

  return { frames, timestamps };
}
