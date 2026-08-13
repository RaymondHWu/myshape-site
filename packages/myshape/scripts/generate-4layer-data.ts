#!/usr/bin/env node
/**
 * Generate 4-layer test data for MyShape CLI demo.
 * v2: fixed camera direction changes + frequency entropy + AI differentiation
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ALL_JOINTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

let _seed = 42;
function rand(): number {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return _seed / 0x7fffffff;
}
function randn(): number {
  const u = 1 - rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// ── Human pose frames: rich motion + noise + tremor + frequency content ──
function generateHumanFrames(durationSec: number, fps: number, motionType: "walk" | "sit") {
  const frameCount = durationSec * fps;
  const frames: Record<number, { x: number; y: number; z: number }>[] = [];
  const timestamps: number[] = [];

  for (let i = 0; i < frameCount; i++) {
    const baseT = (i / fps) * 1000;
    const jitter = (rand() - 0.5) * 18;
    timestamps.push(Math.round(baseT + jitter));

    const frame: Record<number, { x: number; y: number; z: number }> = {};
    const t = i / fps;

    for (const jid of ALL_JOINTS) {
      const baseX = 400 + (jid % 8) * 30;
      const baseY = 200 + Math.floor(jid / 8) * 100;

      let motionX = 0, motionY = 0;
      if (motionType === "walk") {
        motionX = Math.sin(t * 2.5 + jid * 0.3) * 20 + Math.sin(t * 7.3 + jid * 0.7) * 5 + Math.sin(t * 0.8) * 3;
        motionY = Math.sin(t * 5.0 + jid * 0.5) * 12 + Math.sin(t * 11.2 + jid * 0.4) * 3;
      } else {
        motionX = Math.sin(t * 0.8 + jid * 0.2) * 3 + Math.sin(t * 2.1 + jid * 0.5) * 1.5;
        motionY = Math.sin(t * 1.2 + jid * 0.4) * 2 + Math.sin(t * 3.7 + jid * 0.3) * 1;
      }

      const noiseX = randn() * 0.8;
      const noiseY = randn() * 0.8;
      const noiseZ = randn() * 0.3;
      const tremorX = Math.sin(t * 35 + jid * 1.2) * 0.4 + randn() * 0.25;
      const tremorY = Math.cos(t * 32 + jid * 0.9) * 0.4 + randn() * 0.25;

      frame[jid] = { x: baseX + motionX + noiseX + tremorX, y: baseY + motionY + noiseY + tremorY, z: noiseZ };
    }
    frames.push(frame);
  }
  return { frames, timestamps };
}

// ── AI pose frames: smooth, no noise, no tremor, uniform timing ──
function generateAIFrames(durationSec: number, fps: number) {
  const frameCount = durationSec * fps;
  const frames: Record<number, { x: number; y: number; z: number }>[] = [];
  const timestamps: number[] = [];

  for (let i = 0; i < frameCount; i++) {
    timestamps.push(Math.round((i / fps) * 1000));
    const frame: Record<number, { x: number; y: number; z: number }> = {};
    const t = i / fps;

    for (const jid of ALL_JOINTS) {
      const baseX = 400 + (jid % 8) * 30;
      const baseY = 200 + Math.floor(jid / 8) * 100;
      const motionX = Math.sin(t * 2.5 + jid * 0.3) * 20;
      const motionY = Math.sin(t * 5.0 + jid * 0.5) * 12;
      const noiseX = randn() * 0.01;
      const noiseY = randn() * 0.01;
      frame[jid] = { x: baseX + motionX + noiseX, y: baseY + motionY + noiseY, z: 0 };
    }
    frames.push(frame);
  }
  return { frames, timestamps };
}

// ── Correlated IMU + camera from shared trajectory (human walk/sit) ──
// Velocity is derived from a shared heading(t); IMU accel = dv/dt, camera = ∫v dt.
// This guarantees IMU jerk peaks and camera direction changes fire at the SAME
// turn events with matching direction (both = Δvelocity / centripetal).
function generateCorrelated(durationSec: number, motionType: "walk" | "sit") {
  const imuHz = 62, dt = 1 / imuHz;
  const n = Math.floor(durationSec * imuHz);
  const v = 0.6; // world speed (m/s)

  const turns = motionType === "walk"
    ? [[0.9, 1.6], [2.1, -1.6], [3.4, 1.6], [4.7, -1.6], [5.9, 1.6], [7.1, -1.6]]
    : [[1.0, 1.5], [2.4, -1.5], [3.8, 1.5], [5.2, -1.5], [6.6, 1.5]];

  // heading over time — smoothstep transitions (≈100ms) at each turn
  const TAU = 0.10;
  const heading: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i * dt; let h = 0;
    for (const [tt, dh] of turns) {
      const s = (t - tt) / TAU;
      if (s <= 0) continue;
      if (s >= 1) h += dh;
      else h += dh * s * s * (3 - 2 * s); // smoothstep
    }
    heading.push(h);
  }

  // velocity + position (integrate velocity)
  const vel: { vx: number; vy: number }[] = [];
  const pos: { t: number; x: number; y: number }[] = [];
  let x = 0, y = 0;
  for (let i = 0; i < n; i++) {
    const vx = v * Math.cos(heading[i]);
    const vy = v * Math.sin(heading[i]);
    vel.push({ vx, vy });
    pos.push({ t: i * dt * 1000, x, y });
    x += vx * dt; y += vy * dt;
  }

  // IMU acceleration = dv/dt (no noise — biological noise only feeds EE-001 via frames)
  const imu: any[] = [];
  for (let i = 0; i < n; i++) {
    const p = Math.max(0, i - 1);
    const ax = (vel[i].vx - vel[p].vx) / dt;
    const ay = (vel[i].vy - vel[p].vy) / dt;
    imu.push({ t: Math.round(pos[i].t), ax: +ax.toFixed(4), ay: +ay.toFixed(4), az: 9.8, rx: 0, ry: 0, rz: 0, interval: Math.round(1000 / imuHz) });
  }

  // camera = position downsampled to 7Hz
  const camHz = 7;
  const cam: any[] = [];
  for (let j = 0; ; j++) {
    const i = Math.round(j * imuHz / camHz); if (i >= n) break;
    cam.push({ t: Math.round(pos[i].t), x: +(400 + pos[i].x * 200 + randn() * 1).toFixed(2), y: +(300 + pos[i].y * 200 + randn() * 1).toFixed(2), z: 0 });
  }
  return { imu, cam };
}

// ── AI IMU: smooth sinusoid, no noise, no turns (→ EE-002 fails) ──
function generateAIIMU(durationSec: number, hz: number) {
  const count = durationSec * hz;
  const imu: any[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / hz) * 1000;
    const ax = Math.sin(t / 1000 * 2.5) * 1.2;
    const ay = Math.sin(t / 1000 * 5.0) * 0.8;
    const az = 9.8 + Math.sin(t / 1000 * 5.0) * 0.5;
    const rx = Math.sin(t / 1000 * 2.5) * 25;
    const ry = Math.cos(t / 1000 * 2.5) * 15;
    const rz = Math.sin(t / 1000 * 1.2) * 8;
    imu.push({ t: Math.round(t), ax: +ax.toFixed(4), ay: +ay.toFixed(4), az: +az.toFixed(4), rx: +rx.toFixed(4), ry: +ry.toFixed(4), rz: +rz.toFixed(4), interval: Math.round(1000 / hz) });
  }
  return imu;
}

// ── AI camera: smooth sinusoid, no direction changes ──
function generateAICam(durationSec: number, hz: number) {
  const count = durationSec * hz;
  const cam: any[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / hz) * 1000;
    cam.push({ t: Math.round(t), x: +(400 + Math.sin(t / 1000 * 2.5) * 40).toFixed(2), y: +(300 + Math.sin(t / 1000 * 5.0) * 20).toFixed(2), z: 0 });
  }
  return cam;
}

// ── Challenge results ──
function generateChallengeResults(humanLike: boolean) {
  const directions = ["←", "↑", "→", "↓"] as const;
  const results: any[] = [];
  for (let round = 0; round < 3; round++) {
    const dir = directions[Math.floor(rand() * 4)];
    const directionMatch = humanLike ? rand() > 0.02 : rand() > 0.75;
    const angleDeg = humanLike ? 45 + rand() * 30 : 20 + rand() * 15;
    const peakG = humanLike ? 0.35 + rand() * 0.35 : 0.08 + rand() * 0.08;
    const magnitudeStatus = humanLike ? (rand() > 0.1 ? "PASS" : "INSUFFICIENT") : (rand() > 0.4 ? "FAIL" : "INSUFFICIENT");
    results.push({ round, direction: dir, jitterMs: Math.round(rand() * 400 + 500), angleDeg: Math.round(angleDeg), directionMatch, peakG: +peakG.toFixed(3), magnitudeStatus, sampleCount: 120 });
  }
  return results;
}

// ── Main ──
const dataDir = join(__dirname, "..", "data");
mkdirSync(dataDir, { recursive: true });

_seed = 42;
const walkFrames = generateHumanFrames(8, 30, "walk");
const walkSensors = generateCorrelated(8, "walk");
writeFileSync(join(dataDir, "human-walk-4layer.json"), JSON.stringify({
  imu: walkSensors.imu, cam: walkSensors.cam,
  frames: walkFrames.frames, timestamps: walkFrames.timestamps,
  challengeResults: generateChallengeResults(true),
}, null, 2));
console.log("✓ human-walk-4layer.json");

_seed = 128;
const sitFrames = generateHumanFrames(8, 30, "sit");
const sitSensors = generateCorrelated(8, "sit");
writeFileSync(join(dataDir, "human-sit-4layer.json"), JSON.stringify({
  imu: sitSensors.imu, cam: sitSensors.cam,
  frames: sitFrames.frames, timestamps: sitFrames.timestamps,
  challengeResults: generateChallengeResults(true),
}, null, 2));
console.log("✓ human-sit-4layer.json");

_seed = 999;
const aiFrames = generateAIFrames(8, 30);
writeFileSync(join(dataDir, "ai-synthetic-4layer.json"), JSON.stringify({
  imu: generateAIIMU(8, 62), cam: generateAICam(8, 7),
  frames: aiFrames.frames, timestamps: aiFrames.timestamps,
  challengeResults: generateChallengeResults(false),
}, null, 2));
console.log("✓ ai-synthetic-4layer.json");
console.log("\nAll 4-layer test data generated (v2).");