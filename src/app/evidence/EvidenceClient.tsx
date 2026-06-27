"use client";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import VerificationDashboard from "@/components/verification/VerificationDashboard";
import { playTick } from "@/utils/useAudioTick";

const BENCHMARKS = [
  { test: "Genuine Human", score: "0.9817", verdict: "PASS ✓", accent: "text-cyan-300/80" },
  { test: "AI Forgery (GPT-5)", score: "0.5857", verdict: "FAIL ✗", accent: "text-amber-300/60" },
  { test: "Impostor", score: "0.0000", verdict: "FAIL ✗", accent: "text-red-300/50" },
];

const VECTOR_SAMPLE = {
  Kinematics: "0.42",
  Acceleration: "0.88",
  Jerk: "0.15",
  "Jerk Spectrum": "0.71",
  "PES Score": "0.94",
  "ZK Hash": "0x7f3a...b2e1",
};

const ATTACK_SUMMARY = [
  { class: "A — Generative AI", severity: "Critical", success: "~0%", detection: "Frequency entropy collapse" },
  { class: "B — Replay & Imitation", severity: "High", success: "Near zero", detection: "Uniform inter-frame timing" },
  { class: "C — Sensor & System", severity: "Medium", success: "Very low", detection: "Multi-dimension corroboration" },
];

export default function EvidenceClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30">
      <ProtocolHeader />
      <BackgroundParticles />

      <div className="relative z-10 max-w-5xl mx-auto px-6 pt-28 pb-16 space-y-16">
        {/* Header */}
        <div className="text-center">
          <div className="text-cyan-500/45 text-[10px] tracking-[0.5em] uppercase mb-6">PROTOCOL_EVIDENCE // V1.0_GENESIS</div>
          <h1 className="text-2xl md:text-4xl font-light tracking-[0.08em] text-white mb-4"
            style={{ textShadow: "0 0 40px rgba(144,200,255,0.2)" }}>Show Me</h1>
          <p className="text-white/30 text-[12px] max-w-xl mx-auto leading-relaxed">
            Verifiable proof that MyShape Protocol distinguishes human presence from synthetic simulation.
            Every claim on this page is reproducible.
          </p>
        </div>

        {/* ── 1. PES Benchmark ── */}
        <section>
          <h2 className="text-white/25 text-[10px] tracking-[0.4em] uppercase mb-6 text-center"
            onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>PES Benchmark Results</h2>
          <div className="max-w-lg mx-auto border border-cyan-400/12 bg-cyan-400/[0.02] p-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="p-3 text-white/15 text-[8px] tracking-[0.2em] uppercase font-normal">Test Case</th>
                  <th className="p-3 text-white/15 text-[8px] tracking-[0.2em] uppercase font-normal">PES</th>
                  <th className="p-3 text-white/15 text-[8px] tracking-[0.2em] uppercase font-normal text-right">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {BENCHMARKS.map((b) => (
                  <tr key={b.test} className="border-b border-white/[0.02] hover:bg-cyan-400/[0.02] transition-colors"
                    onMouseEnter={() => playTick(600, "sine", 0.05, 0.01)}>
                    <td className="p-3 text-white/35 text-[10px]">{b.test}</td>
                    <td className="p-3 font-mono text-[12px] text-cyan-300/70">{b.score}</td>
                    <td className={`p-3 text-[9px] text-right font-mono ${b.accent}`}>{b.verdict}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 pt-3 border-t border-white/[0.04] flex justify-between text-[8px]">
              <span className="text-white/15">Human—AI Gap</span>
              <span className="text-cyan-300/60 font-mono">0.3960</span>
            </div>
          </div>
          <p className="text-white/12 text-[8px] text-center mt-3 tracking-[0.1em]">
            Source: myshape-demo CLI &middot; Rust core engine &middot; 25/25 tests pass
          </p>
        </section>

        {/* ── 2. Identity Vector ── */}
        <section className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-white/25 text-[10px] tracking-[0.4em] uppercase mb-4"
              onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>Sample Identity Vector</h2>
            <div className="border border-cyan-400/12 bg-cyan-400/[0.02] p-5">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(VECTOR_SAMPLE).map(([k, v]) => (
                  <div key={k} className="flex justify-between p-2 border border-white/[0.03]"
                    onMouseEnter={() => playTick(450, "sine", 0.03, 0.008)}>
                    <span className="text-white/20 text-[9px]">{k}</span>
                    <span className="text-cyan-300/50 font-mono text-[10px]">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 3. Attack Summary ── */}
          <div>
            <h2 className="text-white/25 text-[10px] tracking-[0.4em] uppercase mb-4"
              onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>Attack Surface Summary</h2>
            <div className="border border-cyan-400/12 bg-cyan-400/[0.02] p-5 space-y-1.5">
              {ATTACK_SUMMARY.map((a) => (
                <div key={a.class} className="flex items-center gap-2 p-2 border border-white/[0.03] hover:bg-cyan-400/[0.02] transition-colors"
                  onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.severity === "Critical" ? "bg-red-400" : a.severity === "High" ? "bg-amber-400" : "bg-cyan-400"}`} />
                  <span className="text-white/25 text-[9px] flex-1">{a.class}</span>
                  <span className="text-cyan-300/50 font-mono text-[8px]">{a.success}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 4. Live Verification ── */}
        <section>
          <h2 className="text-white/25 text-[10px] tracking-[0.4em] uppercase mb-6 text-center"
            onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>Live Verification Engine</h2>
          <VerificationDashboard />
        </section>

        {/* ── CTA ── */}
        <section className="text-center py-8 border-t border-white/[0.04] space-y-4">
          <p className="text-white/20 text-[10px]">All evidence is reproducible. Run the benchmarks yourself.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/motion-demo"
              onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
              className="px-8 py-3 border border-cyan-400/30 text-cyan-300/70 text-[10px] tracking-[0.3em] uppercase hover:bg-cyan-400/[0.04] hover:text-white transition-all"
              style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)", background: "rgba(34,211,238,0.03)" }}>
              Try Live Demo →
            </Link>
            <Link href="/papers/threat-model"
              onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
              className="px-8 py-3 border border-cyan-400/20 text-cyan-300/45 text-[10px] tracking-[0.3em] uppercase hover:border-cyan-400/35 hover:text-cyan-200/70 transition-all">
              Full Threat Model →
            </Link>
            <Link href="/whitepaper"
              onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
              className="px-8 py-3 border border-cyan-400/20 text-cyan-300/45 text-[10px] tracking-[0.3em] uppercase hover:border-cyan-400/35 hover:text-cyan-200/70 transition-all">
              Whitepaper →
            </Link>
          </div>
        </section>
      </div>

      <ProtocolFooter />
    </div>
  );
}
