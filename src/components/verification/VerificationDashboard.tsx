"use client";

import { useState, useEffect, useRef } from "react";
import { playTick } from "@/utils/useAudioTick";

// ── Demo Run Data (live from myshape-demo CLI) ──────────────────────

const VERIFICATION_RESULTS = [
  {
    id: "genuine-human",
    label: "GENUINE HUMAN",
    subtitle: "Real-time biological motion · 8–12 Hz tremor · 1/f jerk spectrum",
    score: 0.9817,
    threshold: 0.75,
    passed: true,
    factors: { motion: 0.97, device: 1.0, context: 1.0 },
    verdict: "PRESENCE CONFIRMED",
    verdictClass: "text-cyan-400",
    glowClass: "shadow-[0_0_20px_rgba(34,211,238,0.15)]",
    rowClass: "border-cyan-500/20",
  },
  {
    id: "ai-forgery",
    label: "AI FORGERY",
    subtitle: "GPT-5 / DeepSeek synthetic motion · over-smoothed dynamics",
    score: 0.5857,
    threshold: 0.75,
    passed: false,
    factors: { motion: 0.31, device: 1.0, context: 1.0 },
    verdict: "PRESENCE DENIED",
    verdictClass: "text-red-400",
    glowClass: "shadow-[0_0_20px_rgba(248,113,113,0.1)]",
    rowClass: "border-red-500/20",
  },
  {
    id: "impostor",
    label: "IMPOSTOR",
    subtitle: "Different human body · different device · kinematic mismatch",
    score: 0.0,
    threshold: 0.75,
    passed: false,
    factors: { motion: 0.955, device: 0.0, context: 0.0 },
    verdict: "HARD GATE · DEVICE MISMATCH",
    verdictClass: "text-orange-400",
    glowClass: "shadow-[0_0_20px_rgba(251,146,60,0.1)]",
    rowClass: "border-orange-500/20",
  },
];

const AI_REJECTION_TAGS = [
  {
    label: "TREMOR_ABSENT",
    detail: "8–12 Hz physiological tremor missing",
    icon: "◈",
    full: "Physiological tremor (8–12 Hz): ABSENT. Human neural control loops produce narrow-band micro-oscillations at 8–12 Hz via the stretch reflex arc. AI motion models, trained with L2 loss, systematically suppress these frequencies.",
  },
  {
    label: "JERK_SPECTRUM_ANOMALY",
    detail: "1/f spectral scaling violated",
    icon: "◈",
    full: "Jerk spectrum 1/f scaling: VIOLATED. Human jerk magnitude follows approximate 1/f^α scaling (α ≈ 1.0–1.5) in 1–15 Hz, reflecting multi-scale biological motor control. AI-generated jerk exhibits α > 2.0 (over-smoothed) or α ≈ 0 (white noise).",
  },
  {
    label: "HURST_ANOMALY",
    detail: "Long-range dependence absent",
    icon: "◈",
    full: "Hurst exponent anomaly: DETECTED. Human acceleration exhibits H ≈ 0.6–0.8 (persistent, long-memory process). AI-generated acceleration converges to H ≈ 0.5 (uncorrelated noise after smoothing), revealing the absence of biological motor unit recruitment dynamics.",
  },
  {
    label: "OVER_SMOOTHED",
    detail: "Muscle micro-perturbations missing",
    icon: "◈",
    full: "Muscle micro-perturbations: MISSING. Real human motion contains non-stationary, multi-scale noise from asynchronous motor unit firing. AI output is geometrically correct but kinematically sterile — too perfect to be biological.",
  },
];

// ── Animated Counter ─────────────────────────────────────────────────

function AnimatedScore({
  target,
  durationMs = 1200,
}: {
  target: number;
  durationMs?: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / durationMs, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(target * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, durationMs]);

  return (
    <span className="font-mono tabular-nums">
      {display.toFixed(4)}
    </span>
  );
}

// ── Factor Bar ───────────────────────────────────────────────────────

function FactorBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  const color =
    value > 0.7
      ? "bg-gradient-to-r from-cyan-500/80 to-cyan-400/60"
      : value > 0.4
        ? "bg-gradient-to-r from-amber-500/60 to-amber-400/40"
        : "bg-gradient-to-r from-red-500/60 to-red-400/40";

  return (
    <div className="flex items-center gap-3">
      <span className="text-white/30 text-[10px] tracking-[0.15em] uppercase w-16 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-1.5 bg-white/[0.04] overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-white/50 font-mono text-[10px] w-12 text-right tabular-nums">
        {value.toFixed(3)}
      </span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export default function VerificationDashboard() {
  const [expandedTag, setExpandedTag] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  const gap = VERIFICATION_RESULTS[0].score - VERIFICATION_RESULTS[1].score;

  return (
    <div
      className={`transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* ── Section Header ── */}
      <div className="space-y-4 mb-10">
        <div className="text-cyan-500/50 text-[10px] tracking-[0.5em] uppercase">
          LIVE_VERIFICATION // v0.1
        </div>
        <h2 className="text-3xl md:text-4xl font-light tracking-[0.15em] text-white uppercase">
          Presence Verification Dashboard
        </h2>
        <p className="text-white/40 text-[12px] leading-relaxed max-w-2xl">
          Runtime engine output from <code className="text-cyan-400/60">myshape-demo</code> CLI.
          Motion Signature Engine (128-dim, 4 feature groups) + Multi-Factor Scorer.
          All scores computed by the Rust core engine compiled to native binary.
        </p>
      </div>

      {/* ── The Gap — Hero Metric ── */}
      <div className="mb-10 p-6 transition-all duration-500" style={{ border: "1px solid rgba(144,200,255,0.1)", background: "transparent" }}
        onMouseEnter={e => { playTick(600, "sine", 0.08, 0.02); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}>
        <div className="text-cyan-400/40 text-[8px] tracking-[0.4em] uppercase mb-3 font-mono">
          HUMAN—AI DIVERGENCE
        </div>
        <div className="flex items-baseline gap-4 flex-wrap">
          <span className="text-5xl md:text-6xl font-light font-mono tracking-tight text-cyan-300/80">
            <AnimatedScore target={gap} durationMs={1800} />
          </span>
          <div className="space-y-1">
            <div className="text-white/30 text-[9px] tracking-[0.3em] uppercase font-mono">
              Presence Gap
            </div>
            <div className="text-white/40 text-[10px] leading-relaxed max-w-md font-mono">
              The irreducible distance between genuine biological motion and
              the best AI-generated forgery. This gap exists because AI models
              cannot replicate the physics of the human nervous system.
            </div>
          </div>
        </div>
      </div>

      {/* ── Score Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
        {VERIFICATION_RESULTS.map((r) => (
          <div
            key={r.id}
            onMouseEnter={e => { playTick(800, "sine", 0.08, 0.02); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}
            className={`border p-5 transition-all duration-500 ${r.rowClass} ${r.glowClass}`}
            style={{ borderColor: "rgba(144,200,255,0.1)", background: "transparent" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/20 text-[8px] tracking-[0.4em] uppercase">
                {r.label}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  r.passed ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]"
                }`}
              />
            </div>

            {/* Score */}
            <div className="mb-2">
              <span
                className={`text-3xl font-light font-mono tracking-tight ${
                  r.passed ? "text-cyan-300" : "text-red-300"
                }`}
              >
                <AnimatedScore target={r.score} durationMs={1500} />
              </span>
            </div>

            {/* Verdict */}
            <div
              className={`text-[10px] tracking-[0.3em] uppercase mb-3 font-bold ${r.verdictClass}`}
            >
              {r.verdict}
            </div>

            {/* Subtitle */}
            <div className="text-white/25 text-[10px] leading-relaxed mb-3">
              {r.subtitle}
            </div>

            {/* Factor bars */}
            <div className="space-y-1.5">
              <FactorBar label="Motion" value={r.factors.motion} />
              <FactorBar label="Device" value={r.factors.device} />
              <FactorBar label="Context" value={r.factors.context} />
            </div>

            {/* Threshold reference */}
            <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-[9px]">
              <span className="text-white/20">Threshold</span>
              <span className="text-white/40 font-mono">{r.threshold.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── AI Rejection Analysis ── */}
      <div className="border p-6 mb-10 transition-all duration-500"
        style={{ borderColor: "rgba(144,200,255,0.1)", background: "transparent" }}
        onMouseEnter={e => { playTick(600, "sine", 0.06, 0.015); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}>
        <div className="flex items-center gap-3 mb-5">
          <span className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)] animate-pulse" />
          <span className="text-red-400/60 text-[9px] tracking-[0.4em] uppercase">
            AI REJECTION ROOT CAUSE ANALYSIS
          </span>
        </div>

        <div className="text-white/30 text-[11px] leading-relaxed mb-5 max-w-3xl">
          The AI forgery failed verification because the Motion Signature
          Engine detected structural deficiencies across four independent
          dimensions. These are not temporary AI limitations — they are
          consequences of how neural network architectures model motion.
        </div>

        {/* Rejection Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AI_REJECTION_TAGS.map((tag, i) => (
            <div key={tag.label}>
              <button
                onClick={() => setExpandedTag(expandedTag === i ? null : i)}
                onMouseEnter={() => playTick(700, "sine", 0.06, 0.015)}
                className={`w-full text-left border p-3 transition-all ${
                  expandedTag === i
                    ? "border-red-400/40 bg-red-500/[0.04]"
                    : "border-white/5 hover:border-red-500/20 bg-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-red-400/50 text-[14px]">{tag.icon}</span>
                  <span className="text-red-300/70 font-mono text-[10px] tracking-[0.15em]">
                    {tag.label}
                  </span>
                </div>
                <div className="text-white/40 text-[9px] mt-1 ml-6 leading-relaxed">
                  {tag.detail}
                </div>
              </button>
              {expandedTag === i && (
                <div className="border border-t-0 p-3 text-[10px] leading-relaxed font-mono" style={{ borderColor: "rgba(248,113,113,0.2)", color: "rgba(255,255,255,0.35)", background: "transparent" }}>
                  {tag.full}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Protocol Status Footer ── */}
      <div className="border p-5 transition-all duration-500"
        style={{ borderColor: "rgba(144,200,255,0.1)", background: "transparent" }}
        onMouseEnter={e => { playTick(500, "sine", 0.04, 0.01); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
            <span className="text-white/20 text-[8px] tracking-[0.3em] uppercase">
              Engine
            </span>
            <span className="text-cyan-400/70 font-mono text-[9px]">
              v0.1.0 · 25/25 tests pass
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
            <span className="text-white/20 text-[8px] tracking-[0.3em] uppercase">
              Features
            </span>
            <span className="text-cyan-400/70 font-mono text-[9px]">
              K · A · J · J_spec (4/7 active)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
            <span className="text-white/20 text-[8px] tracking-[0.3em] uppercase">
              Factors
            </span>
            <span className="text-cyan-400/70 font-mono text-[9px]">
              M(0.60) · D(0.25) · C(0.15)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
            <span className="text-white/20 text-[8px] tracking-[0.3em] uppercase">
              Risk API
            </span>
            <span className="text-cyan-400/70 font-mono text-[9px]">
              LOW · MEDIUM · HIGH
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
