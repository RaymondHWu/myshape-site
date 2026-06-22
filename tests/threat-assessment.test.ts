/**
 * Threat Assessment — Live Test
 * Generates simulated PES component data and verifies all 8 attack signatures
 * correctly fire (or don't fire) under realistic conditions.
 *
 * Run: npx tsx tests/threat-assessment.test.ts
 */

import { assessThreat } from "../src/engine/threat-assessment";
import type { PESComponents } from "../src/engine/presence-entropy";

// ── Test data generators ──

function humanStanding(): PESComponents {
  return {
    microTimingVariance: 0.18,    // MediaPipe has natural timing variance
    noiseResidual: 0.55,           // Real sensor noise
    frequencyEntropy: 0.12,        // Some spectral diversity from micro-movements
    biologicalPerturbation: 0.48,  // Cross-joint jerk correlation present
  };
}

function humanMoving(): PESComponents {
  return {
    microTimingVariance: 0.35,
    noiseResidual: 0.72,
    frequencyEntropy: 0.28,        // Rich frequency content from motion
    biologicalPerturbation: 0.65,
  };
}

function aiDiffusionMotion(): PESComponents {
  // AI diffusion: smooth, lacks frequency entropy + jerk correlation
  return {
    microTimingVariance: 0.22,     // Can fake timing
    noiseResidual: 0.45,           // Can fake some noise
    frequencyEntropy: 0.03,        // ❌ Spectral collapse
    biologicalPerturbation: 0.06,  // ❌ No jerk correlation
  };
}

function aiNeuralPrediction(): PESComponents {
  // AI prediction: overly smooth, missing biological perturbation
  return {
    microTimingVariance: 0.15,
    noiseResidual: 0.08,           // ❌ Too clean
    frequencyEntropy: 0.18,
    biologicalPerturbation: 0.04,  // ❌ No cross-joint jerk
  };
}

function replayAttack(): PESComponents {
  // Replayed motion: uniform timing
  return {
    microTimingVariance: 0.02,     // ❌ Near-uniform frame timing
    noiseResidual: 0.50,
    frequencyEntropy: 0.15,
    biologicalPerturbation: 0.40,
  };
}

function mocapData(): PESComponents {
  // Professional mocap: over-clean
  return {
    microTimingVariance: 0.28,
    noiseResidual: 0.04,           // ❌ No sensor noise
    frequencyEntropy: 0.20,
    biologicalPerturbation: 0.35,
  };
}

function sensorSpoof(): PESComponents {
  return {
    microTimingVariance: 0.30,
    noiseResidual: 0.06,           // ❌ Too clean for real sensor
    frequencyEntropy: 0.10,
    biologicalPerturbation: 0.30,
  };
}

function adversarialPose(): PESComponents {
  return {
    microTimingVariance: 0.20,
    noiseResidual: 0.50,
    frequencyEntropy: 0.025,       // ❌ Anomalous spectral pattern from adversarial perturbations
    biologicalPerturbation: 0.10,  // ❌ Adversarial injection breaks jerk correlation
  };
}

function statisticalForgery(): PESComponents {
  return {
    microTimingVariance: 0.25,
    noiseResidual: 0.55,
    frequencyEntropy: 0.15,
    biologicalPerturbation: 0.07,  // ❌ Cannot satisfy jerk correlation
  };
}

// ── Run tests ──

const testCases: Array<{ name: string; data: PESComponents; expected: "human" | "suspicious" | "likely_synthetic"; pes: number }> = [
  { name: "Human — Standing Still",       data: humanStanding(),       expected: "human",             pes: 0.45 },
  { name: "Human — Moving",               data: humanMoving(),        expected: "human",             pes: 0.68 },
  { name: "AI — Diffusion Motion",        data: aiDiffusionMotion(),  expected: "likely_synthetic",  pes: 0.25 },
  { name: "AI — Neural Prediction",       data: aiNeuralPrediction(), expected: "likely_synthetic",  pes: 0.18 },
  { name: "Attack — Replay",              data: replayAttack(),       expected: "suspicious",        pes: 0.38 },
  { name: "Attack — Mocap Forgery",       data: mocapData(),          expected: "suspicious",        pes: 0.30 },
  { name: "Attack — Sensor Spoof",        data: sensorSpoof(),        expected: "suspicious",        pes: 0.28 },
  { name: "Attack — Adversarial Pose",    data: adversarialPose(),    expected: "likely_synthetic",  pes: 0.22 },
  { name: "Attack — Statistical Forgery", data: statisticalForgery(), expected: "suspicious",        pes: 0.33 },
];

console.log("═".repeat(72));
console.log("  MyShape Protocol — Threat Assessment Live Test");
console.log("═".repeat(72));
console.log("");

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  const result = assessThreat(tc.pes, tc.data);
  const ok = result.overallVerdict === tc.expected;
  const icon = ok ? "✅" : "❌";

  if (ok) passed++; else failed++;

  console.log(`${icon} ${tc.name}`);
  console.log(`   Expected: ${tc.expected}  |  Got: ${result.overallVerdict}  |  Confidence: ${(result.confidence * 100).toFixed(0)}%`);
  if (result.flaggedAttacks.length > 0) {
    console.log(`   Flagged: ${result.flaggedAttacks.map(f => `${f.severity}:${f.class}`).join(", ")}`);
    for (const f of result.flaggedAttacks) {
      console.log(`     ${f.severity === "critical" ? "🔴" : "🟡"} ${f.class} (${f.metric}: ${f.value.toFixed(3)})`);
    }
  } else {
    console.log(`   Flagged: none — clean human signal`);
  }
  console.log("");
}

console.log("═".repeat(72));
console.log(`  Results: ${passed} passed, ${failed} failed out of ${testCases.length}`);
console.log("═".repeat(72));

process.exit(failed > 0 ? 1 : 0);
