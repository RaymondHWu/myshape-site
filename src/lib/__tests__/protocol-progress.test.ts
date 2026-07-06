// ============================================================
// Protocol Progress Mapper — Tests
// ============================================================

import { describe, it, expect } from "vitest";
import {
  computeStage,
  computeNextReputation,
  computeStreakMilestone,
  computeEligibility,
  buildNarrative,
  computeProtocolProgress,
  computeApproximateReputationTier,
  deriveIdentityStage,
  deriveRights,
  deriveTokenTier,
  computeProtocolProgressFromDb,
} from "@/lib/protocol-progress";
import type { ProtocolProgressInput, ProtocolStage } from "@/types/protocol-progress";
import type { DbNodeRow } from "@/lib/protocol-progress";

// ── Test fixtures ──

function freshInput(overrides?: Partial<ProtocolProgressInput>): ProtocolProgressInput {
  return {
    entropyScore: 0,
    particleLevel: 1,
    streakDays: 0,
    streakMultiplier: 1.0,
    prs: 0,
    reputationTier: "untrusted",
    totalProofs: 0,
    avgPes: 0,
    identityStage: "genesis",
    rights: ["existence", "mobility"],
    votingPower: 0,
    tokenTier: "basic",
    presenceValue: 0,
    ...overrides,
  };
}

// ============================================================
// computeStage
// ============================================================

describe("computeStage", () => {
  it("returns GENESIS for a brand-new untrusted node", () => {
    expect(computeStage("untrusted", 1)).toBe("GENESIS");
  });

  it("returns GENESIS for a new node with low particles", () => {
    expect(computeStage("new", 2)).toBe("GENESIS");
  });

  it("returns FORMATION when regular tier AND particle ≥ 3", () => {
    expect(computeStage("regular", 3)).toBe("FORMATION");
  });

  it("returns FORMATION when established tier but particle < 5", () => {
    expect(computeStage("established", 4)).toBe("FORMATION");
  });

  it("returns SOVEREIGN when established tier AND particle ≥ 5", () => {
    expect(computeStage("established", 5)).toBe("SOVEREIGN");
  });

  it("returns SOVEREIGN for genesis reputation tier with high particles", () => {
    expect(computeStage("genesis", 7)).toBe("SOVEREIGN");
  });

  it("keeps regular at GENESIS if particle < 3", () => {
    expect(computeStage("regular", 2)).toBe("GENESIS");
  });
});

// ============================================================
// computeNextReputation
// ============================================================

describe("computeNextReputation", () => {
  it("returns new as next from untrusted", () => {
    const result = computeNextReputation("untrusted");
    expect(result).toEqual({ tier: "new", minScore: 0, minProofs: 1 });
  });

  it("returns regular as next from new", () => {
    const result = computeNextReputation("new");
    expect(result).toEqual({ tier: "regular", minScore: 0.4, minProofs: 10 });
  });

  it("returns established as next from regular", () => {
    const result = computeNextReputation("regular");
    expect(result).toEqual({ tier: "established", minScore: 0.6, minProofs: 30 });
  });

  it("returns genesis as next from established", () => {
    const result = computeNextReputation("established");
    expect(result).toEqual({ tier: "genesis", minScore: 0.8, minProofs: 100 });
  });

  it("returns null for genesis (no next tier)", () => {
    expect(computeNextReputation("genesis")).toBeNull();
  });
});

// ============================================================
// computeStreakMilestone
// ============================================================

describe("computeStreakMilestone", () => {
  it("targets 7-day milestone from 0 days", () => {
    const result = computeStreakMilestone(0);
    expect(result).toEqual({ nextMilestone: 7, daysToNextMilestone: 7 });
  });

  it("targets 7-day milestone from 5 days", () => {
    const result = computeStreakMilestone(5);
    expect(result).toEqual({ nextMilestone: 7, daysToNextMilestone: 2 });
  });

  it("targets 30-day milestone from 10 days", () => {
    const result = computeStreakMilestone(10);
    expect(result).toEqual({ nextMilestone: 30, daysToNextMilestone: 20 });
  });

  it("targets 30-day milestone from 25 days", () => {
    const result = computeStreakMilestone(25);
    expect(result).toEqual({ nextMilestone: 30, daysToNextMilestone: 5 });
  });

  it("returns null when at max streak (30+)", () => {
    const result = computeStreakMilestone(30);
    expect(result).toEqual({ nextMilestone: null, daysToNextMilestone: null });
  });

  it("returns null when beyond max streak", () => {
    const result = computeStreakMilestone(60);
    expect(result).toEqual({ nextMilestone: null, daysToNextMilestone: null });
  });
});

// ============================================================
// computeEligibility
// ============================================================

describe("computeEligibility", () => {
  it("all false for untrusted zero-proof node", () => {
    const e = computeEligibility("untrusted", 1, 0);
    expect(e).toEqual({
      genesisKey: false,
      zkOps: false,
      governance: false,
      protocolCouncil: false,
    });
  });

  it("genesisKey true after first proof", () => {
    const e = computeEligibility("new", 2, 1);
    expect(e.genesisKey).toBe(true);
    expect(e.zkOps).toBe(false);
  });

  it("zkOps true for regular + particle ≥ 3 + ≥ 10 proofs", () => {
    const e = computeEligibility("regular", 3, 12);
    expect(e.zkOps).toBe(true);
    expect(e.governance).toBe(false);
  });

  it("governance true for established + particle ≥ 5 + ≥ 30 proofs", () => {
    const e = computeEligibility("established", 5, 35);
    expect(e.governance).toBe(true);
    expect(e.protocolCouncil).toBe(false);
  });

  it("protocolCouncil true for genesis + particle ≥ 7 + ≥ 100 proofs", () => {
    const e = computeEligibility("genesis", 8, 150);
    expect(e.protocolCouncil).toBe(true);
  });

  it("governance false when particle too low despite established rep", () => {
    const e = computeEligibility("established", 3, 50);
    expect(e.governance).toBe(false);
  });
});

// ============================================================
// buildNarrative
// ============================================================

describe("buildNarrative", () => {
  it("prompts first scan for zero-proof user", () => {
    const input = freshInput();
    const narrative = buildNarrative(input, "GENESIS");

    expect(narrative.summary).toContain("first motion scan");
    expect(narrative.nextUnlock).not.toBeNull();
    expect(narrative.nextUnlock!.label).toContain("Genesis Key");
  });

  it("shows next unlock for progressing user", () => {
    const input = freshInput({
      entropyScore: 250,
      particleLevel: 2,
      reputationTier: "new",
      totalProofs: 5,
    });
    const narrative = buildNarrative(input, "GENESIS");

    expect(narrative.nextUnlock).not.toBeNull();
    expect(narrative.nextUnlock!.label).toContain("ZK");
  });

  it("returns null nextUnlock when all gates unlocked", () => {
    const input = freshInput({
      entropyScore: 5000,
      particleLevel: 7,
      reputationTier: "genesis",
      totalProofs: 150,
      prs: 0.9,
    });
    const narrative = buildNarrative(input, "SOVEREIGN");

    expect(narrative.nextUnlock).toBeNull();
    expect(narrative.summary).toContain("Sovereign");
  });

  it("shows governance weight in Sovereign stage summary", () => {
    const input = freshInput({
      entropyScore: 5000,
      particleLevel: 6,
      reputationTier: "established",
      totalProofs: 50,
      votingPower: 0.65,
    });
    const narrative = buildNarrative(input, "SOVEREIGN");

    expect(narrative.summary).toContain("65%");
  });
});

// ============================================================
// computeProtocolProgress — full integration
// ============================================================

describe("computeProtocolProgress", () => {
  // ── Genesis stage user ──

  it("maps a brand-new untrusted node correctly", () => {
    const input = freshInput();
    const progress = computeProtocolProgress(input);

    expect(progress.stage).toBe("GENESIS");
    expect(progress.particle.level).toBe(1);
    expect(progress.particle.label).toBe("SEED");
    expect(progress.particle.glow).toBe(0.08);
    expect(progress.particle.particleCount).toBe(0);
    expect(progress.particle.nextLabel).toBe("SPROUT");

    expect(progress.reputation.tier).toBe("untrusted");
    expect(progress.reputation.score).toBe(0);
    expect(progress.reputation.requiredForNext).toEqual({
      tier: "new", minScore: 0, minProofs: 1,
    });

    expect(progress.identity.stage).toBe("genesis");
    expect(progress.identity.rights).toEqual(["existence", "mobility"]);
    expect(progress.identity.canGovern).toBe(false);
    expect(progress.identity.canParticipate).toBe(false);

    expect(progress.isEligibleFor.genesisKey).toBe(false);
    expect(progress.isEligibleFor.zkOps).toBe(false);
    expect(progress.isEligibleFor.governance).toBe(false);

    expect(progress.economy.tokenTier).toBe("basic");
    expect(progress.streak.days).toBe(0);
    expect(progress.streak.multiplier).toBe(1.0);
    expect(progress.streak.nextMilestone).toBe(7);
  });

  // ── Formation stage user ──

  it("maps a regular reputation node with particle 3 correctly", () => {
    const input = freshInput({
      entropyScore: 350,
      particleLevel: 3,
      streakDays: 8,
      streakMultiplier: 1.5,
      prs: 0.45,
      reputationTier: "regular",
      totalProofs: 15,
      avgPes: 0.65,
      identityStage: "formation",
      rights: ["existence", "mobility", "participation", "economic"],
      votingPower: 0.25,
      tokenTier: "presence",
      presenceValue: 0.35,
    });
    const progress = computeProtocolProgress(input);

    expect(progress.stage).toBe("FORMATION");
    expect(progress.particle.label).toBe("PULSE");
    expect(progress.particle.glow).toBe(0.22);
    expect(progress.reputation.tier).toBe("regular");
    expect(progress.reputation.requiredForNext!.tier).toBe("established");
    expect(progress.identity.canParticipate).toBe(true);
    expect(progress.identity.canGovern).toBe(false);
    expect(progress.isEligibleFor.zkOps).toBe(true);
    expect(progress.isEligibleFor.governance).toBe(false);
    expect(progress.streak.nextMilestone).toBe(30);
    expect(progress.streak.multiplier).toBe(1.5);
    expect(progress.economy.tokenTier).toBe("presence");
  });

  // ── Sovereign stage user ──

  it("maps an established node with governance rights correctly", () => {
    const input = freshInput({
      entropyScore: 6000,
      particleLevel: 6,
      streakDays: 35,
      streakMultiplier: 2.0,
      prs: 0.85,
      reputationTier: "established",
      totalProofs: 80,
      avgPes: 0.82,
      identityStage: "maturity",
      rights: ["existence", "mobility", "participation", "economic"],
      votingPower: 0.72,
      tokenTier: "validator",
      presenceValue: 0.65,
    });
    const progress = computeProtocolProgress(input);

    expect(progress.stage).toBe("SOVEREIGN");
    expect(progress.particle.label).toBe("SOVEREIGN");
    expect(progress.particle.glow).toBe(0.55);
    expect(progress.reputation.tier).toBe("established");
    expect(progress.identity.canParticipate).toBe(true);
    // established gets participation + economic, NOT governance (genesis only)
    expect(progress.identity.canGovern).toBe(false);
    expect(progress.isEligibleFor.governance).toBe(true);
    expect(progress.isEligibleFor.protocolCouncil).toBe(false);
    expect(progress.streak.nextMilestone).toBeNull();
    expect(progress.streak.multiplier).toBe(2.0);
    expect(progress.economy.tokenTier).toBe("validator");
  });

  it("maps a genesis tier max-level node correctly", () => {
    const input = freshInput({
      entropyScore: 35000,
      particleLevel: 8,
      streakDays: 60,
      streakMultiplier: 2.0,
      prs: 0.95,
      reputationTier: "genesis",
      totalProofs: 200,
      avgPes: 0.88,
      identityStage: "maturity",
      rights: ["existence", "mobility", "participation", "economic", "governance"],
      votingPower: 0.95,
      tokenTier: "genesis",
      presenceValue: 0.85,
    });
    const progress = computeProtocolProgress(input);

    expect(progress.stage).toBe("SOVEREIGN");
    expect(progress.particle.label).toBe("PROTOCOL_ELDER");
    expect(progress.particle.level).toBe(8);
    expect(progress.particle.nextLabel).toBeNull();
    expect(progress.particle.levelProgress).toBe(1);
    expect(progress.reputation.tier).toBe("genesis");
    expect(progress.reputation.requiredForNext).toBeNull();
    expect(progress.identity.canGovern).toBe(true);
    expect(progress.identity.canParticipate).toBe(true);
    expect(progress.identity.votingPower).toBe(0.95);
    expect(progress.isEligibleFor.protocolCouncil).toBe(true);
    expect(progress.narrative.nextUnlock).toBeNull();
  });

  // ── Edge cases ──

  it("handles level 1 → 2 progression correctly", () => {
    const input = freshInput({
      entropyScore: 101,
      particleLevel: 2,
      reputationTier: "new",
      totalProofs: 2,
      avgPes: 0.55,
    });
    const progress = computeProtocolProgress(input);

    expect(progress.particle.label).toBe("SPROUT");
    expect(progress.particle.nextLabel).toBe("PULSE");
    expect(progress.particle.levelProgress).toBeGreaterThan(0);
    expect(progress.particle.levelProgress).toBeLessThan(1);
    expect(progress.particle.remainingToNext).toBeGreaterThan(0);
    expect(progress.particle.remainingToNext).toBe(199);
  });

  it("clamps particle level to valid range", () => {
    const input = freshInput({
      entropyScore: 999999,
      particleLevel: 8,
    });
    const progress = computeProtocolProgress(input);

    expect(progress.particle.level).toBe(8);
    expect(progress.particle.label).toBe("PROTOCOL_ELDER");
    expect(progress.particle.nextLabel).toBeNull();
    expect(progress.particle.levelProgress).toBe(1);
  });

  it("correctly identifies canParticipate for regular tier", () => {
    const input = freshInput({
      reputationTier: "regular",
      totalProofs: 15,
      rights: ["existence", "mobility", "participation", "economic"],
    });
    const progress = computeProtocolProgress(input);

    expect(progress.identity.canParticipate).toBe(true);
    expect(progress.identity.canGovern).toBe(false);
  });
});

// ============================================================
// Stage boundary consistency
// ============================================================

describe("stage transitions are monotonic", () => {
  it("GENESIS → FORMATION → SOVEREIGN is strictly increasing", () => {
    const stages: ProtocolStage[] = ["GENESIS", "FORMATION", "SOVEREIGN"];
    const repTiers = ["new", "regular", "established"] as const;

    for (let i = 0; i < stages.length - 1; i++) {
      const lower = computeStage(repTiers[i], i + 2);
      const higher = computeStage(repTiers[i + 1], i + 4);

      const lowerIdx = stages.indexOf(lower);
      const higherIdx = stages.indexOf(higher);
      expect(higherIdx).toBeGreaterThanOrEqual(lowerIdx);
    }
  });
});

// ============================================================
// computeApproximateReputationTier
// ============================================================

describe("computeApproximateReputationTier", () => {
  it("returns untrusted for zero scans", () => {
    expect(computeApproximateReputationTier(0, 0)).toBe("untrusted");
  });

  it("returns new for a single scan with low PES", () => {
    expect(computeApproximateReputationTier(0.3, 1)).toBe("new");
  });

  it("returns regular at PES ≥ 0.4 and ≥ 10 scans", () => {
    expect(computeApproximateReputationTier(0.45, 12)).toBe("regular");
  });

  it("returns established at PES ≥ 0.6 and ≥ 30 scans", () => {
    expect(computeApproximateReputationTier(0.65, 35)).toBe("established");
  });

  it("returns genesis at PES ≥ 0.8 and ≥ 100 scans", () => {
    expect(computeApproximateReputationTier(0.85, 120)).toBe("genesis");
  });

  it("keeps new when PES is high but scan count low", () => {
    expect(computeApproximateReputationTier(0.9, 5)).toBe("new");
  });
});

// ============================================================
// deriveIdentityStage
// ============================================================

describe("deriveIdentityStage", () => {
  it("returns formation for GENESIS_NODE at moderate particle level", () => {
    expect(deriveIdentityStage("GENESIS_NODE", 4)).toBe("formation");
  });

  it("returns maturity for GENESIS_NODE at high particle level", () => {
    expect(deriveIdentityStage("GENESIS_NODE", 7)).toBe("maturity");
  });

  it("returns accumulation for ACTIVE at particle ≥ 3", () => {
    expect(deriveIdentityStage("ACTIVE", 4)).toBe("accumulation");
  });

  it("returns genesis for ACTIVE at low particle level", () => {
    expect(deriveIdentityStage("ACTIVE", 1)).toBe("genesis");
  });

  it("returns genesis for unknown status", () => {
    expect(deriveIdentityStage("PENDING_VERIFICATION", 1)).toBe("genesis");
  });
});

// ============================================================
// deriveRights
// ============================================================

describe("deriveRights", () => {
  it("gives existence + mobility to untrusted nodes", () => {
    expect(deriveRights("ACTIVE", "untrusted")).toEqual(["existence", "mobility"]);
  });

  it("gives participation + economic to GENESIS_NODE", () => {
    const rights = deriveRights("GENESIS_NODE", "new");
    expect(rights).toContain("participation");
    expect(rights).toContain("economic");
  });

  it("gives governance only to GENESIS_NODE with genesis reputation", () => {
    const rights = deriveRights("GENESIS_NODE", "genesis");
    expect(rights).toContain("governance");
  });

  it("does NOT give governance to GENESIS_NODE with regular reputation", () => {
    const rights = deriveRights("GENESIS_NODE", "regular");
    expect(rights).not.toContain("governance");
  });
});

// ============================================================
// deriveTokenTier
// ============================================================

describe("deriveTokenTier", () => {
  it("returns basic for new node", () => {
    expect(deriveTokenTier("ACTIVE", "new", 0.2)).toBe("basic");
  });

  it("returns presence at PES ≥ 0.3", () => {
    expect(deriveTokenTier("ACTIVE", "new", 0.35)).toBe("presence");
  });

  it("returns validator for established with PES ≥ 0.5", () => {
    expect(deriveTokenTier("ACTIVE", "established", 0.55)).toBe("validator");
  });

  it("returns genesis for GENESIS_NODE with genesis rep and PES ≥ 0.75", () => {
    expect(deriveTokenTier("GENESIS_NODE", "genesis", 0.8)).toBe("genesis");
  });
});

// ============================================================
// computeProtocolProgressFromDb — API integration path
// ============================================================

describe("computeProtocolProgressFromDb", () => {
  const freshRow: DbNodeRow = {
    status: "PENDING_VERIFICATION",
    scanCount: 0,
    entropyScore: 0,
    particleLevel: 1,
    streakDays: 0,
    streakMultiplier: 1.0,
    bestPes: 0,
  };

  it("maps a pending node → GENESIS stage with SEED particle", () => {
    const progress = computeProtocolProgressFromDb(freshRow);

    expect(progress.stage).toBe("GENESIS");
    expect(progress.particle.label).toBe("SEED");
    expect(progress.particle.level).toBe(1);
    expect(progress.narrative.summary).toContain("first motion scan");
    expect(progress.isEligibleFor.genesisKey).toBe(false);
  });

  it("maps an ACTIVE node with 15 scans + moderate PES → FORMATION stage", () => {
    const progress = computeProtocolProgressFromDb({
      ...freshRow,
      status: "ACTIVE",
      scanCount: 15,
      entropyScore: 500,
      particleLevel: 3,
      bestPes: 0.55,
      streakDays: 8,
      streakMultiplier: 1.5,
    });

    expect(progress.stage).toBe("FORMATION");
    expect(progress.particle.label).toBe("PULSE");
    expect(progress.reputation.tier).toBe("regular");
    expect(progress.identity.canGovern).toBe(false);
    expect(progress.isEligibleFor.zkOps).toBe(true);
  });

  it("maps a GENESIS_NODE with 80 scans + high PES → SOVEREIGN stage", () => {
    const progress = computeProtocolProgressFromDb({
      ...freshRow,
      status: "GENESIS_NODE",
      scanCount: 80,
      entropyScore: 8000,
      particleLevel: 6,
      bestPes: 0.82,
      streakDays: 40,
      streakMultiplier: 2.0,
    });

    expect(progress.stage).toBe("SOVEREIGN");
    expect(progress.particle.label).toBe("SOVEREIGN");
    expect(progress.reputation.tier).toBe("established");
    expect(progress.identity.canParticipate).toBe(true);
    expect(progress.isEligibleFor.governance).toBe(true);
    expect(progress.isEligibleFor.protocolCouncil).toBe(false);
  });

  it("maps a GENESIS_NODE at max level + genesis rep → full Sovereign with council", () => {
    const progress = computeProtocolProgressFromDb({
      ...freshRow,
      status: "GENESIS_NODE",
      scanCount: 150,
      entropyScore: 35000,
      particleLevel: 8,
      bestPes: 0.90,
      streakDays: 60,
      streakMultiplier: 2.0,
    });

    expect(progress.stage).toBe("SOVEREIGN");
    expect(progress.particle.label).toBe("PROTOCOL_ELDER");
    expect(progress.reputation.tier).toBe("genesis");
    expect(progress.reputation.requiredForNext).toBeNull();
    expect(progress.identity.canGovern).toBe(true);
    expect(progress.identity.canParticipate).toBe(true);
    expect(progress.isEligibleFor.protocolCouncil).toBe(true);
    expect(progress.economy.tokenTier).toBe("genesis");
    expect(progress.narrative.nextUnlock).toBeNull();
    expect(progress.streak.nextMilestone).toBeNull();
  });
});
