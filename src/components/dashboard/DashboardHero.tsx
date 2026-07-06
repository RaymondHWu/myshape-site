"use client";

import type { ProtocolProgress } from "@/types/protocol-progress";
import { playTick } from "@/utils/useAudioTick";

const STAGE_LABELS: Record<string, { label: string; accent: string; glow: string }> = {
  GENESIS:   { label: "Genesis",   accent: "var(--accent-cyan)",  glow: "rgba(34,211,238,0.3)" },
  FORMATION: { label: "Formation", accent: "var(--accent-ice)",   glow: "rgba(144,200,255,0.3)" },
  SOVEREIGN: { label: "Sovereign", accent: "var(--accent-gold)",  glow: "rgba(212,175,55,0.3)" },
};

type Props = { progress: ProtocolProgress };

export default function DashboardHero({ progress }: Props) {
  const stageInfo = STAGE_LABELS[progress.stage] ?? STAGE_LABELS.GENESIS;
  const { particle, streak, reputation } = progress;
  const progressPct = particle.levelProgress * 100;

  return (
    <section
      className="dashboard-hero"
      onMouseEnter={() => playTick(550, "sine", 0.05, 0.012)}
    >
      {/* ── Stage badge ── */}
      <div className="hero-stage-row">
        <span
          className="hero-stage-dot"
          style={{ background: stageInfo.accent, boxShadow: `0 0 10px ${stageInfo.glow}` }}
        />
        <span className="hero-stage-label">{stageInfo.label} Cycle</span>
        <span className="hero-stage-tier">{reputation.tier}</span>
      </div>

      {/* ── Particle identity ── */}
      <div className="hero-particle-identity">
        <span
          className="hero-particle-glow"
          style={{
            textShadow: `0 0 ${20 + particle.glow * 40}px ${stageInfo.glow}`,
            color: stageInfo.accent,
          }}
        >
          {particle.label}
        </span>
        <span className="hero-particle-sub">
          Particle Level {particle.level} / 8
        </span>
      </div>

      {/* ── Progress bar ── */}
      <div className="hero-progress-track">
        <div
          className="hero-progress-fill"
          style={{
            width: `${Math.max(progressPct, 2)}%`,
            background: `linear-gradient(90deg, ${stageInfo.accent}44, ${stageInfo.accent}, ${stageInfo.accent}88)`,
            boxShadow: `0 0 14px ${stageInfo.glow}`,
          }}
        />
      </div>

      {/* ── Next level hint ── */}
      <div className="hero-next-row">
        <span className="hero-next-hint">
          {particle.nextLabel
            ? `${particle.remainingToNext} entropy to ${particle.nextLabel}`
            : "Maximum particle coherence — Protocol Elder"}
        </span>
        <span className="hero-next-pct">
          {progressPct.toFixed(0)}%
        </span>
      </div>

      {/* ── Continuity metric ── */}
      <div className="hero-streak-row">
        <span className="hero-streak-days">
          {streak.days} day streak · {streak.multiplier.toFixed(1)}× multiplier
        </span>
        {streak.nextMilestone && (
          <span className="hero-streak-next">
            {streak.daysToNextMilestone} days to {streak.nextMilestone}d milestone
          </span>
        )}
        {!streak.nextMilestone && (
          <span className="hero-streak-max">Maximum streak achieved</span>
        )}
      </div>
    </section>
  );
}
