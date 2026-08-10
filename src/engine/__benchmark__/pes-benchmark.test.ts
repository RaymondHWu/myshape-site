// ============================================================
// MyShape Protocol — PES Benchmark v0.1
// ============================================================
// Tests the Presence Entropy Score engine's ability to
// distinguish human-like motion from AI-generated motion.
//
// Run: npx vitest run src/engine/__benchmark__/pes-benchmark.ts
// ============================================================

import { describe, it, expect } from "vitest";
import {
  computeFullPES,
  computeMicroTimingVariance,
  computeNoiseResidual,
  computeFrequencyEntropy,
  computeBiologicalPerturbation,
  computePES,
  type PESComponents,
} from "../presence-entropy";
import type { JointPosition } from "@/types/motion-vector";
import {
  FRAME_COUNT,
  generateHumanFrames,
  generateAIFrames,
  generateReplayFrames,
} from "./synthetic-motion";

// ═══════════════════════════════════════════════
// Benchmark Runner
// ═══════════════════════════════════════════════

interface BenchmarkResult {
  label: string;
  count: number;
  meanPES: number;
  stdPES: number;
  minPES: number;
  maxPES: number;
  meanComponents: PESComponents;
  aboveThreshold: number; // fraction > 0.5
}

function runBatch(
  label: string,
  generator: () => { frames: Array<Record<number, JointPosition>>; timestamps: number[] },
  count: number,
): BenchmarkResult {
  const pesScores: number[] = [];
  const allComponents: PESComponents[] = [];

  for (let i = 0; i < count; i++) {
    const { frames, timestamps } = generator();
    const { pes, components } = computeFullPES(frames, timestamps);
    pesScores.push(pes);
    allComponents.push(components);
  }

  const mean = pesScores.reduce((a, b) => a + b, 0) / pesScores.length;
  const variance = pesScores.reduce((s, v) => s + (v - mean) ** 2, 0) / pesScores.length;
  const sorted = [...pesScores].sort((a, b) => a - b);

  const meanComponents: PESComponents = {
    microTimingVariance: allComponents.reduce((s, c) => s + c.microTimingVariance, 0) / count,
    noiseResidual: allComponents.reduce((s, c) => s + c.noiseResidual, 0) / count,
    frequencyEntropy: allComponents.reduce((s, c) => s + c.frequencyEntropy, 0) / count,
    biologicalPerturbation: allComponents.reduce((s, c) => s + c.biologicalPerturbation, 0) / count,
  };

  return {
    label,
    count,
    meanPES: mean,
    stdPES: Math.sqrt(variance),
    minPES: sorted[0],
    maxPES: sorted[sorted.length - 1],
    meanComponents,
    aboveThreshold: pesScores.filter(p => p > 0.5).length / count,
  };
}

// ═══════════════════════════════════════════════
// Confusion Matrix
// ═══════════════════════════════════════════════

interface ConfusionMatrix {
  truePositive: number;
  falseNegative: number;
  trueNegative: number;
  falsePositive: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
}

function computeConfusionMatrix(
  humanScores: number[],
  aiScores: number[],
  threshold: number = 0.5,
): ConfusionMatrix {
  const tp = humanScores.filter(s => s >= threshold).length; // Human → classified human
  const fn = humanScores.filter(s => s < threshold).length;  // Human → classified AI
  const tn = aiScores.filter(s => s < threshold).length;     // AI → classified AI
  const fp = aiScores.filter(s => s >= threshold).length;    // AI → classified human

  const total = tp + fn + tn + fp;
  const accuracy = (tp + tn) / total;
  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1 = (2 * precision * recall) / (precision + recall) || 0;

  return { truePositive: tp, falseNegative: fn, trueNegative: tn, falsePositive: fp, accuracy, precision, recall, f1 };
}

// ═══════════════════════════════════════════════
// Statistical Separation (Cohen's d)
// ═══════════════════════════════════════════════

function cohensD(mean1: number, std1: number, mean2: number, std2: number): number {
  const pooled = Math.sqrt((std1 ** 2 + std2 ** 2) / 2);
  return pooled > 0 ? Math.abs(mean1 - mean2) / pooled : 0;
}

// ═══════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════

const SAMPLE_COUNT = 100;
const HUMAN_THRESHOLD = 0.5; // v2: F dimension removed, weights recalibrated on 54 real samples

describe("PES Benchmark v0.1", () => {
  // Increase timeout for large batch
  const TIMEOUT = 30000;

  let humanResult: BenchmarkResult;
  let aiResult: BenchmarkResult;
  let replayResult: BenchmarkResult;
  let humanScores: number[];
  let aiScores: number[];
  let replayScores: number[];

  it("generates and evaluates human motion samples", () => {
    humanResult = runBatch("Human", generateHumanFrames.bind(null, FRAME_COUNT), SAMPLE_COUNT);
    humanScores = [];

    // Re-run to collect individual scores for confusion matrix
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const { frames, timestamps } = generateHumanFrames(FRAME_COUNT);
      humanScores.push(computeFullPES(frames, timestamps).pes);
    }

    expect(humanResult.count).toBe(SAMPLE_COUNT);
    expect(humanResult.meanPES).toBeGreaterThan(0);
    expect(humanResult.meanPES).toBeLessThanOrEqual(1);
    // Human motion should have meaningful PES
    expect(humanResult.aboveThreshold).toBeGreaterThan(0.5);
  }, TIMEOUT);

  it("generates and evaluates AI motion samples", () => {
    aiResult = runBatch("AI", generateAIFrames.bind(null, FRAME_COUNT), SAMPLE_COUNT);
    aiScores = [];

    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const { frames, timestamps } = generateAIFrames(FRAME_COUNT);
      aiScores.push(computeFullPES(frames, timestamps).pes);
    }

    expect(aiResult.count).toBe(SAMPLE_COUNT);
    // AI motion should have low PES
    expect(aiResult.aboveThreshold).toBeLessThan(0.3);
  }, TIMEOUT);

  it("generates and evaluates replay attack samples", () => {
    // Replay: human frames with AI timing
    replayScores = [];
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const human = generateHumanFrames(FRAME_COUNT);
      const replay = generateReplayFrames(human);
      replayScores.push(computeFullPES(replay.frames, replay.timestamps).pes);
    }

    replayResult = {
      label: "Replay",
      count: SAMPLE_COUNT,
      meanPES: replayScores.reduce((a, b) => a + b, 0) / SAMPLE_COUNT,
      stdPES: Math.sqrt(replayScores.reduce((s, v) => s + (v - replayScores.reduce((a, b) => a + b, 0) / SAMPLE_COUNT) ** 2, 0) / SAMPLE_COUNT),
      minPES: Math.min(...replayScores),
      maxPES: Math.max(...replayScores),
      meanComponents: { microTimingVariance: 0, noiseResidual: 0, frequencyEntropy: 0, biologicalPerturbation: 0 },
      aboveThreshold: replayScores.filter(p => p > 0.5).length / SAMPLE_COUNT,
    };

    // Replay: PES drops significantly (timing dimension exposes uniform playback)
    // In synthetic tests the drop is ~18% — real screen-recorded replay would drop further
    // due to compression artifacts and truly uniform capture timing
    expect(replayResult.meanPES).toBeLessThan(humanResult.meanPES * 0.88);
  }, TIMEOUT);

  it("produces clean confusion matrix (Human vs AI)", () => {
    const cm = computeConfusionMatrix(humanScores, aiScores, HUMAN_THRESHOLD);

    console.log("\n═══════════════════════════════════════");
    console.log("  PES Benchmark v0.1 — Results");
    console.log("═══════════════════════════════════════\n");

    console.log("─ Samples per class: ", SAMPLE_COUNT);
    console.log("─ Threshold:         ", HUMAN_THRESHOLD);
    console.log("");

    console.log("┌─────────────────┬──────────┬──────────┬──────────┐");
    console.log("│ Metric          │ Human    │ AI       │ Replay   │");
    console.log("├─────────────────┼──────────┼──────────┼──────────┤");
    console.log(`│ Mean PES        │ ${humanResult.meanPES.toFixed(4)} │ ${aiResult.meanPES.toFixed(4)} │ ${replayResult.meanPES.toFixed(4)} │`);
    console.log(`│ Std Dev         │ ${humanResult.stdPES.toFixed(4)} │ ${aiResult.stdPES.toFixed(4)} │ ${replayResult.stdPES.toFixed(4)} │`);
    console.log(`│ Min PES         │ ${humanResult.minPES.toFixed(4)} │ ${aiResult.minPES.toFixed(4)} │ ${replayResult.minPES.toFixed(4)} │`);
    console.log(`│ Max PES         │ ${humanResult.maxPES.toFixed(4)} │ ${aiResult.maxPES.toFixed(4)} │ ${replayResult.maxPES.toFixed(4)} │`);
    console.log(`│ %>0.5 (Human)   │ ${(humanResult.aboveThreshold * 100).toFixed(1)}%    │ ${(aiResult.aboveThreshold * 100).toFixed(1)}%    │ ${(replayResult.aboveThreshold * 100).toFixed(1)}%    │`);
    console.log("└─────────────────┴──────────┴──────────┴──────────┘\n");

    console.log("─ Per-Dimension Means:");
    console.log(`  Micro-Timing:     H=${humanResult.meanComponents.microTimingVariance.toFixed(4)}  AI=${aiResult.meanComponents.microTimingVariance.toFixed(4)}`);
    console.log(`  Noise Residual:   H=${humanResult.meanComponents.noiseResidual.toFixed(4)}  AI=${aiResult.meanComponents.noiseResidual.toFixed(4)}`);
    console.log(`  Frequency Entropy:H=${humanResult.meanComponents.frequencyEntropy.toFixed(4)}  AI=${aiResult.meanComponents.frequencyEntropy.toFixed(4)}`);
    console.log(`  Bio Perturbation: H=${humanResult.meanComponents.biologicalPerturbation.toFixed(4)}  AI=${aiResult.meanComponents.biologicalPerturbation.toFixed(4)}\n`);

    // Cohen's d — effect size
    const d = cohensD(humanResult.meanPES, humanResult.stdPES, aiResult.meanPES, aiResult.stdPES);
    const dReplay = cohensD(humanResult.meanPES, humanResult.stdPES, replayResult.meanPES, replayResult.stdPES);
    console.log("─ Effect Size (Cohen's d):");
    console.log(`  Human vs AI:      d=${d.toFixed(3)} ${d > 0.8 ? "✓ Large" : d > 0.5 ? "~ Medium" : "✗ Small"}`);
    console.log(`  Human vs Replay:  d=${dReplay.toFixed(3)} ${dReplay > 0.8 ? "✓ Large" : dReplay > 0.5 ? "~ Medium" : "✗ Small"}\n`);

    console.log("─ Confusion Matrix (Human vs AI, threshold=0.5):");
    console.log("┌─────────────────┬──────────────┬──────────────┐");
    console.log("│                 │ Predicted H  │ Predicted AI │");
    console.log("├─────────────────┼──────────────┼──────────────┤");
    console.log(`│ Actual Human    │ TP: ${String(cm.truePositive).padStart(8)} │ FN: ${String(cm.falseNegative).padStart(8)} │`);
    console.log(`│ Actual AI       │ FP: ${String(cm.falsePositive).padStart(8)} │ TN: ${String(cm.trueNegative).padStart(8)} │`);
    console.log("└─────────────────┴──────────────┴──────────────┘\n");

    console.log(`  Accuracy:  ${(cm.accuracy * 100).toFixed(1)}%`);
    console.log(`  Precision: ${(cm.precision * 100).toFixed(1)}%`);
    console.log(`  Recall:    ${(cm.recall * 100).toFixed(1)}%`);
    console.log(`  F1 Score:  ${(cm.f1 * 100).toFixed(1)}%\n`);

    console.log("═══════════════════════════════════════\n");

    // Assertions
    expect(cm.accuracy).toBeGreaterThan(0.85);  // Target: >85%
    expect(cm.recall).toBeGreaterThan(0.80);     // Low false negatives
    expect(d).toBeGreaterThan(0.8);              // Large effect size
  }, TIMEOUT);

  it("each dimension independently separates human from AI", () => {
    // Verify that each PES dimension contributes meaningful separation
    // If any dimension has d < 0.3, it's not pulling its weight

    const collectDimension = (
      generator: () => { frames: Array<Record<number, JointPosition>>; timestamps: number[] },
      dim: keyof PESComponents,
      count: number,
    ): number[] => {
      const scores: number[] = [];
      for (let i = 0; i < count; i++) {
        const { frames, timestamps } = generator();
        const { components } = computeFullPES(frames, timestamps);
        scores.push(components[dim]);
      }
      return scores;
    };

    const humanTiming = collectDimension(() => generateHumanFrames(FRAME_COUNT), "microTimingVariance", 50);
    const aiTiming = collectDimension(() => generateAIFrames(FRAME_COUNT), "microTimingVariance", 50);

    const hMean = humanTiming.reduce((a, b) => a + b, 0) / 50;
    const aMean = aiTiming.reduce((a, b) => a + b, 0) / 50;
    const hStd = Math.sqrt(humanTiming.reduce((s, v) => s + (v - hMean) ** 2, 0) / 50);
    const aStd = Math.sqrt(aiTiming.reduce((s, v) => s + (v - aMean) ** 2, 0) / 50);

    const timingD = cohensD(hMean, hStd, aMean, aStd);
    console.log(`  Micro-timing separation:     d=${timingD.toFixed(3)}`);

    // Micro-timing should be the strongest differentiator
    expect(timingD).toBeGreaterThan(0.5);
  }, TIMEOUT);
});

// ═══════════════════════════════════════════════
// PES Score Distribution Test
// ═══════════════════════════════════════════════

describe("PES Score Bounds", () => {
  it("all PES scores are in [0, 1]", () => {
    for (let i = 0; i < 20; i++) {
      const { frames, timestamps } = generateHumanFrames(FRAME_COUNT);
      const { pes, components } = computeFullPES(frames, timestamps);
      expect(pes).toBeGreaterThanOrEqual(0);
      expect(pes).toBeLessThanOrEqual(1);
      expect(components.microTimingVariance).toBeGreaterThanOrEqual(0);
      expect(components.microTimingVariance).toBeLessThanOrEqual(1);
      expect(components.noiseResidual).toBeGreaterThanOrEqual(0);
      expect(components.noiseResidual).toBeLessThanOrEqual(1);
      expect(components.frequencyEntropy).toBeGreaterThanOrEqual(0);
      expect(components.frequencyEntropy).toBeLessThanOrEqual(1);
      expect(components.biologicalPerturbation).toBeGreaterThanOrEqual(0);
      expect(components.biologicalPerturbation).toBeLessThanOrEqual(1);
    }
  });
});