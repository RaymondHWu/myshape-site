/**
 * PES Engine — Unit Test
 * Verifies 4-dimensional entropy computation responds correctly
 * to human vs synthetic input data.
 *
 * Run: npx tsx tests/pes-engine.test.ts
 */

import { computeMicroTimingVariance, computeNoiseResidual, computeFrequencyEntropy, computeBiologicalPerturbation, computePES, computeFullPES } from "../src/engine/presence-entropy";
import type { JointPosition } from "../src/types/motion-vector";

// ── Generate synthetic skeleton frames ──

type SkeleFrame = Record<number, JointPosition>;

function generateHumanFrames(count: number, noiseLevel = 1.5): SkeleFrame[] {
  const frames: SkeleFrame[] = [];
  for (let t = 0; t < count; t++) {
    const frame: SkeleFrame = {};
    for (let j = 0; j < 18; j++) {
      frame[j] = {
        x: 320 + Math.sin(t * 0.1 + j * 0.5) * 20 + (Math.random() - 0.5) * noiseLevel,
        y: 240 + Math.cos(t * 0.08 + j * 0.3) * 15 + (Math.random() - 0.5) * noiseLevel,
        z: (Math.random() - 0.5) * noiseLevel * 0.5,
      };
    }
    frames.push(frame);
  }
  return frames;
}

function generateAIFrames(count: number): SkeleFrame[] {
  const frames: SkeleFrame[] = [];
  for (let t = 0; t < count; t++) {
    const frame: SkeleFrame = {};
    for (let j = 0; j < 18; j++) {
      // AI: over-smoothed, unnaturally uniform across joints, minimal variation
      // Each joint moves identically — real humans can't do this
      const base = Math.sin(t * 0.05) * 8; // very slow, small motion
      frame[j] = {
        x: 320 + base + (Math.random() - 0.5) * 0.01, // negligible noise
        y: 240 + base * 0.5 + (Math.random() - 0.5) * 0.01,
        z: (Math.random() - 0.5) * 0.005,
      };
    }
    frames.push(frame);
  }
  return frames;
}

function generateTimestamps(count: number, jitter = 16.7): number[] {
  const stamps: number[] = [0];
  for (let i = 1; i < count; i++) {
    stamps.push(stamps[i - 1] + jitter + (Math.random() - 0.5) * 5);
  }
  return stamps;
}

function generateUniformTimestamps(count: number): number[] {
  const stamps: number[] = [0];
  for (let i = 1; i < count; i++) {
    stamps.push(stamps[i - 1] + 16.7); // perfect uniform 60fps
  }
  return stamps;
}

// ── Run tests ──

const humanFrames = generateHumanFrames(60);
const aiFrames = generateAIFrames(60);
const humanTimestamps = generateTimestamps(60);
const uniformTimestamps = generateUniformTimestamps(60);

console.log("═".repeat(72));
console.log("  MyShape Protocol — PES Engine Unit Test");
console.log("═".repeat(72));
console.log("");

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail = ""): void {
  if (condition) { passed++; console.log(`✅ ${label} ${detail}`); }
  else { failed++; console.log(`❌ ${label} ${detail}`); }
}

// ── 1. Micro-Timing Variance ──
const humanTiming = computeMicroTimingVariance(humanTimestamps);
const uniformTiming = computeMicroTimingVariance(uniformTimestamps);
assert("μTiming: Human has variance", humanTiming > 0.05, `(${humanTiming.toFixed(3)})`);
assert("μTiming: Uniform is very low", uniformTiming < 0.05, `(${uniformTiming.toFixed(3)})`);
assert("μTiming: Human > Uniform", humanTiming > uniformTiming, `(${humanTiming.toFixed(3)} vs ${uniformTiming.toFixed(3)})`);

// ── 2. Noise Residual ──
const humanNoise = computeNoiseResidual(humanFrames, 11);
const aiNoise = computeNoiseResidual(aiFrames, 11);
assert("Noise: Human has sensor noise > 0.10", humanNoise > 0.10, `(${humanNoise.toFixed(3)})`);
assert("Noise: Human vs AI differ", Math.abs(humanNoise - aiNoise) > 0.01, `(Δ=${Math.abs(humanNoise - aiNoise).toFixed(3)})`);

// ── 3. Frequency Entropy ──
const humanSignal = humanFrames.map(f => f[11]?.x ?? 0);
const aiSignal = aiFrames.map(f => f[11]?.x ?? 0);
const humanFreq = computeFrequencyEntropy(humanSignal);
const aiFreq = computeFrequencyEntropy(aiSignal);
assert("Freq: Human has spectral diversity", humanFreq > 0.05, `(${humanFreq.toFixed(3)})`);
assert("Freq: AI spectral collapse vs human", aiFreq < humanFreq, `(${aiFreq.toFixed(3)} vs ${humanFreq.toFixed(3)})`);

// ── 4. Biological Perturbation ──
const bioJoints = [3, 4, 5, 6, 7, 8];
const humanBio = computeBiologicalPerturbation(humanFrames, bioJoints);
const aiBio = computeBiologicalPerturbation(aiFrames, bioJoints);
assert("Bio: Human produces valid score", humanBio >= 0, `(${humanBio.toFixed(3)})`);
assert("Bio: AI produces valid score", aiBio >= 0, `(${aiBio.toFixed(3)})`);
assert("Bio: Human ≠ AI (engine differentiates)", Math.abs(humanBio - aiBio) > 0.01, `(Δ=${Math.abs(humanBio - aiBio).toFixed(3)})`);

// ── 5. Full PES Pipeline ──
const humanPes = computeFullPES(humanFrames, humanTimestamps);
const aiPes = computeFullPES(aiFrames, uniformTimestamps);
assert("PES: Human score valid (> 0.30)", humanPes.pes > 0.30, `(${humanPes.pes.toFixed(3)})`);
assert("PES: AI score valid (< 0.50)", aiPes.pes < 0.50, `(${aiPes.pes.toFixed(3)})`);
assert("PES: Human ≠ AI (engine differentiates)", Math.abs(humanPes.pes - aiPes.pes) > 0.001, `(Δ=${Math.abs(humanPes.pes - aiPes.pes).toFixed(3)})`);

// ── 6. Edge Cases ──
const emptyTiming = computeMicroTimingVariance([]);
const singleTiming = computeMicroTimingVariance([100]);
assert("μTiming: Empty → 0", emptyTiming === 0);
assert("μTiming: Single → 0", singleTiming === 0);

const emptyNoise = computeNoiseResidual([], 11);
assert("Noise: Empty → 0", emptyNoise === 0);

const emptyPes = computeFullPES([], []);
assert("PES: Empty → 0", emptyPes.pes === 0);

console.log("");
console.log("═".repeat(72));
console.log(`  Results: ${passed} passed, ${failed} failed out of ${passed + failed}`);
console.log("═".repeat(72));

process.exit(failed > 0 ? 1 : 0);
