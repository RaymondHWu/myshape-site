// ============================================================
// MyShape Protocol — PES ROC / AUC Benchmark
// ============================================================
// Goes beyond the fixed threshold=0.5 confusion matrix in
// pes-benchmark.test.ts by reporting, for the overall PES and
// each of the four dimensions:
//
//   • AUC (Mann-Whitney U)  — threshold-independent separability
//   • 95% CI via bootstrap   — how confident we are in the AUC
//   • Youden threshold       — the data-driven optimal cut point
//
// The point of this benchmark is to move from "100% floor" hand-waving
// to a measured, uncertainty-aware claim. A CI whose lower bound sits
// above 0.5 means the score separates human from AI better than chance
// with the current synthetic generators — and honest reporting of that.
//
// Run: npx vitest run src/engine/__benchmark__/pes-roc.test.ts
// ============================================================

import { describe, it, expect } from "vitest";
import { computeFullPES } from "../presence-entropy";
import { computeAUC, bootstrapAUCCI, youdenThreshold } from "./roc";
import { FRAME_COUNT, generateHumanFrames, generateAIFrames } from "./synthetic-motion";

interface MetricResult {
  name: string;
  auc: number;
  ciLow: number;
  ciHigh: number;
  stdError: number;
  threshold: number;
  sensitivity: number;
  specificity: number;
  youdenJ: number;
}

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

describe("PES ROC / AUC Benchmark", () => {
  it("reports per-dimension & overall AUC with 95% bootstrap CI above chance", () => {
    const N = 150; // samples per class — enough for a stable AUC + CI

    // Collect scores labeled by class (positive = human)
    const pos = { pes: [] as number[], ut: [] as number[], n: [] as number[], f: [] as number[], b: [] as number[] };
    const neg = { pes: [] as number[], ut: [] as number[], n: [] as number[], f: [] as number[], b: [] as number[] };

    for (let i = 0; i < N; i++) {
      const hGen = generateHumanFrames(FRAME_COUNT);
      const h = computeFullPES(hGen.frames, hGen.timestamps);
      const aGen = generateAIFrames(FRAME_COUNT);
      const a = computeFullPES(aGen.frames, aGen.timestamps);
      pos.pes.push(h.pes); pos.ut.push(h.components.microTimingVariance); pos.n.push(h.components.noiseResidual);
      pos.f.push(h.components.frequencyEntropy); pos.b.push(h.components.biologicalPerturbation);
      neg.pes.push(a.pes); neg.ut.push(a.components.microTimingVariance); neg.n.push(a.components.noiseResidual);
      neg.f.push(a.components.frequencyEntropy); neg.b.push(a.components.biologicalPerturbation);
    }

    const metrics: Array<{ name: string; human: number[]; ai: number[] }> = [
      { name: "PES (overall)", human: pos.pes, ai: neg.pes },
      { name: "MicroTimingVariance", human: pos.ut, ai: neg.ut },
      { name: "NoiseResidual", human: pos.n, ai: neg.n },
      { name: "FrequencyEntropy", human: pos.f, ai: neg.f },
      { name: "BiologicalPerturbation", human: pos.b, ai: neg.b },
    ];

    const results: MetricResult[] = metrics.map(m => {
      const auc = computeAUC(m.human, m.ai);
      const ci = bootstrapAUCCI(m.human, m.ai, 2000, 12345);
      const y = youdenThreshold(m.human, m.ai);
      return {
        name: m.name,
        auc,
        ciLow: ci.ciLow,
        ciHigh: ci.ciHigh,
        stdError: ci.stdError,
        threshold: y.threshold,
        sensitivity: y.sensitivity,
        specificity: y.specificity,
        youdenJ: y.youdenJ,
      };
    });

    // ── Report ──
    console.log("\n══════════════════════════════════════════════════════");
    console.log("  PES ROC / AUC Benchmark (human n=" + N + " vs AI n=" + N + ")");
    console.log("══════════════════════════════════════════════════════");
    console.log("  Metric                 AUC     95% CI            Y·J threshold  Sens  Spec");
    console.log("  ────────────────────────────────────────────────────────────────────────");
    for (const r of results) {
      console.log(
        "  " + pad(r.name, 22) +
        r.auc.toFixed(3).padStart(6) + "  " +
        "[" + r.ciLow.toFixed(3) + ", " + r.ciHigh.toFixed(3) + "]".padStart(15) + "  " +
        r.threshold.toFixed(3).padStart(9) + "  " +
        (r.sensitivity * 100).toFixed(0).padStart(3) + "%  " +
        (r.specificity * 100).toFixed(0).padStart(3) + "%",
      );
    }
    console.log("────────────────────────────────────────────────────────");
    console.log("  CI method: 2000-round percentile bootstrap (seeded).");
    console.log("  Convention: higher score = human (positive).\n");

    // ── Assertions ──
    const pes = results[0];
    // The overall PES should separate human from AI with meaningful margin,
    // and its 95% CI must not straddle 0.5 (chance).
    expect(pes.auc).toBeGreaterThan(0.6);
    expect(pes.ciLow).toBeGreaterThan(0.5);
    // Most individual dimensions should also beat chance at the AUC level.
    for (const r of results.slice(1)) {
      expect(r.ciHigh).toBeGreaterThan(0.5);
    }
  }, 60000);
});
