// ============================================================
// MyShape Protocol — Unified Protocol Progress DTO
// ============================================================
// Maps 5 independent engine outputs into a single narrative:
// "The Protocol Journey" — Genesis → Formation → Sovereign
//
// Engines consumed:
//   entropy-growth.ts     → particle level + streak (Kinetic XP)
//   presence-reputation.ts → PRS + tier (Behavioral Proof)
//   presence-identity.ts  → identity stage + rights (Identity Lifecycle)
//   governance-weight.ts  → voting weight (Sovereign Engine)
//   presence-economy.ts   → token tier (Economic Layer)
// ============================================================

import type { ReputationTier } from "@/engine/presence-reputation";
import type { IdentityStage, CitizenshipRight } from "@/engine/presence-identity";
import type { TokenTier } from "@/engine/presence-economy";

// ── The Three Protocol Stages ──

export type ProtocolStage = "GENESIS" | "FORMATION" | "SOVEREIGN";

// ── Unified progress snapshot ──

export interface ProtocolProgress {
  /** Current protocol stage */
  stage: ProtocolStage;

  // ── Kinetic Evolution (Particles / XP) ──
  particle: {
    level: number;                    // 1–8
    label: string;                    // SEED, SPROUT, PULSE, …
    glow: number;                     // visual glow intensity 0.08–1.0
    particleCount: number;            // rendered particle count
    entropyScore: number;             // cumulative entropy
    levelProgress: number;            // [0,1] progress toward next level
    remainingToNext: number;          // entropy points to next level
    nextLabel: string | null;         // next tier label (null at max)
  };

  // ── Behavioral Proof (Reputation / Access) ──
  reputation: {
    score: number;                    // PRS [0,1]
    tier: ReputationTier;             // untrusted | new | regular | established | genesis
    totalProofs: number;
    avgPes: number;
    requiredForNext: {
      tier: ReputationTier;
      minScore: number;
      minProofs: number;
    } | null;                         // null when at genesis tier
  };

  // ── Sovereign Rights (Identity / Governance) ──
  identity: {
    stage: IdentityStage;
    rights: CitizenshipRight[];
    votingPower: number;              // [0,1]
    canGovern: boolean;
    canParticipate: boolean;
  };

  // ── Economic Layer (Token) ──
  economy: {
    tokenTier: TokenTier;
    presenceValue: number;            // [0,1]
  };

  // ── Streak (continuity metric) ──
  streak: {
    days: number;
    multiplier: number;
    nextMilestone: 7 | 30 | null;     // next streak threshold to hit
    daysToNextMilestone: number | null;
  };

  // ── Convenience: boolean eligibility flags (for UI gating) ──
  isEligibleFor: {
    genesisKey: boolean;
    zkOps: boolean;
    governance: boolean;
    protocolCouncil: boolean;
  };

  // ── Narrative helpers (for UI rendering) ──
  narrative: {
    /** One-line summary: "Building your presence — 3 more scans to CORE_FORMING" */
    summary: string;
    /** The "locked feature" teaser: what unlocks next and what's required */
    nextUnlock: {
      label: string;
      requirement: string;
      progress: number;              // [0,1] how close
    } | null;
  };
}

// ── Engine inputs (raw data from DB + engine computations) ──

export interface ProtocolProgressInput {
  // entropy-growth
  entropyScore: number;
  particleLevel: number;
  streakDays: number;
  streakMultiplier: number;

  // presence-reputation
  prs: number;
  reputationTier: ReputationTier;
  totalProofs: number;
  avgPes: number;

  // presence-identity
  identityStage: IdentityStage;
  rights: CitizenshipRight[];
  votingPower: number;

  // presence-economy
  tokenTier: TokenTier;
  presenceValue: number;
}

// ── Stage boundary constants ──

/** Reputation tier thresholds that define stage transitions */
export const STAGE_BOUNDARIES: Record<ProtocolStage, { minTier: ReputationTier; minParticleLevel: number }> = {
  GENESIS:   { minTier: "untrusted", minParticleLevel: 1 },
  FORMATION: { minTier: "regular",   minParticleLevel: 3 }, // PULSE (3) + regular reputation
  SOVEREIGN: { minTier: "established", minParticleLevel: 5 }, // FIELD_ACTIVE (5) + established reputation
};

/** Feature unlock requirements — displayed as teasers in the Dashboard */
export interface UnlockGate {
  feature: string;
  icon: string;          // emoji or icon key
  stage: ProtocolStage;
  minTier: ReputationTier;
  minParticleLevel: number;
  minProofs: number;
}

export const UNLOCK_GATES: UnlockGate[] = [
  {
    feature: "Genesis Key Minting",
    icon: "🔑",
    stage: "GENESIS",
    minTier: "new",
    minParticleLevel: 1,
    minProofs: 1,
  },
  {
    feature: "ZK Presence Proof",
    icon: "🔐",
    stage: "FORMATION",
    minTier: "regular",
    minParticleLevel: 3,
    minProofs: 10,
  },
  {
    feature: "Governance Voting",
    icon: "⚖️",
    stage: "SOVEREIGN",
    minTier: "established",
    minParticleLevel: 5,
    minProofs: 30,
  },
  {
    feature: "Protocol Council",
    icon: "🏛️",
    stage: "SOVEREIGN",
    minTier: "genesis",
    minParticleLevel: 7,
    minProofs: 100,
  },
];
