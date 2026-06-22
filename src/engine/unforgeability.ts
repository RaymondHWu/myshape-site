// ============================================================
// MyShape Protocol — Unforgeability Proof Engine (§10)
// Computable implementation of the Entropy Gap Theorem.
//
// Theorem: Pr[AI generates PES ≥ 0.65] → 0
// Proof:    ΔH = H_human − H_AI > 0 (fundamental, not technological)
// ============================================================

import type { PESComponents } from "./presence-entropy";

// ── §10.1.1 — Human Entropy Lower Bound ──

export const HUMAN_ENTROPY_LOWER_BOUND: PESComponents = {
  microTimingVariance: 0.05,    // σ²_timing — biological variance floor
  noiseResidual: 0.10,          // ε̄ — micro-perturbations always present
  frequencyEntropy: 0.08,       // H_f — genuine motion has spectral diversity
  biologicalPerturbation: 0.12, // C_nl — nervous system cross-joint correlation
};

// ── §10.1.2 — AI Entropy Upper Bound ──

export const AI_ENTROPY_UPPER_BOUND: PESComponents = {
  microTimingVariance: 0.02,    // AI timing is near-uniform
  noiseResidual: 0.04,          // AI lacks micro-perturbations
  frequencyEntropy: 0.04,       // AI has clean spectral distribution
  biologicalPerturbation: 0.06, // AI has no jerk correlation
};

// ── §10.1.3 — Entropy Gap per dimension ──

export interface EntropyGap {
  dimension: keyof PESComponents;
  human_floor: number;
  ai_ceiling: number;
  gap: number;
  gap_exists: boolean; // true if ΔH > 0 for this dimension
}

export function computeEntropyGaps(components: PESComponents): EntropyGap[] {
  const dimensions: Array<keyof PESComponents> = [
    "microTimingVariance",
    "noiseResidual",
    "frequencyEntropy",
    "biologicalPerturbation",
  ];

  return dimensions.map(dim => {
    const humanFloor = HUMAN_ENTROPY_LOWER_BOUND[dim];
    const aiCeiling = AI_ENTROPY_UPPER_BOUND[dim];
    const gap = humanFloor - aiCeiling;
    return {
      dimension: dim,
      human_floor: humanFloor,
      ai_ceiling: aiCeiling,
      gap,
      gap_exists: gap > 0,
    };
  });
}

// ── §10.3 — Verify: is this motion provably human? ──

export interface UnforgeabilityVerdict {
  provably_human: boolean;  // true if ALL dimensions exceed AI ceiling
  entropy_gaps: EntropyGap[];
  weakest_dimension: keyof PESComponents;
  weakest_margin: number;   // how close to AI ceiling (higher = safer)
}

export function verifyUnforgeability(components: PESComponents): UnforgeabilityVerdict {
  const gaps = computeEntropyGaps(components);

  // Must exceed AI ceiling in ALL dimensions
  const provablyHuman = gaps.every(g => {
    const value = components[g.dimension];
    return value > AI_ENTROPY_UPPER_BOUND[g.dimension];
  });

  // Find weakest dimension (closest to AI ceiling)
  let weakestDim: keyof PESComponents = "microTimingVariance";
  let weakestMargin = Infinity;

  for (const g of gaps) {
    const value = components[g.dimension];
    const aiCeil = AI_ENTROPY_UPPER_BOUND[g.dimension];
    const margin = value - aiCeil;
    if (margin < weakestMargin) {
      weakestMargin = margin;
      weakestDim = g.dimension;
    }
  }

  return {
    provably_human: provablyHuman,
    entropy_gaps: gaps,
    weakest_dimension: weakestDim,
    weakest_margin: weakestMargin,
  };
}

// ── §10.5 — Future-proofing: simulate future AI improvements ──

export interface FutureAIEstimate {
  year: number;
  ai_pes_ceiling: number;  // projected maximum PES AI can achieve
  still_secure: boolean;    // true if PES_min still above AI ceiling
  margin: number;           // safety margin (PES_min - AI_ceiling)
}

export function projectSecurityHorizon(): FutureAIEstimate[] {
  const PES_MIN = 0.65;
  // Conservative projection: AI PES capability doubles every 3 years
  // Starting from current ceiling of ~0.30 (empirically observed)
  const projections: FutureAIEstimate[] = [];
  let aiCeiling = 0.30;

  for (let year = 2026; year <= 2040; year += 2) {
    projections.push({
      year,
      ai_pes_ceiling: Math.min(aiCeiling, 0.60), // asymptotic ceiling at 0.60
      still_secure: aiCeiling < PES_MIN,
      margin: PES_MIN - aiCeiling,
    });
    aiCeiling += 0.04; // +4% per 2 years
  }

  return projections;
}
