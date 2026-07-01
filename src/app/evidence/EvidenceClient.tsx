"use client";
import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import VerificationDashboard from "@/components/verification/VerificationDashboard";
import { playTick } from "@/utils/useAudioTick";

const BENCHMARKS = [
  { test: "Genuine Human", score: "0.9817", verdict: "PASS ✓", accent: "text-[#90c8ff]", glow: "shadow-[0_0_6px_rgba(144,200,255,0.3)]" },
  { test: "AI Forgery (GPT-5)", score: "0.5857", verdict: "FAIL ✗", accent: "text-white/30", glow: "" },
  { test: "Impostor", score: "0.0000", verdict: "FAIL ✗", accent: "text-white/20", glow: "" },
];

const VECTOR_SAMPLE = [
  { k: "Kinematics", v: "0.42", desc: "Bone length ratios" },
  { k: "Acceleration", v: "0.88", desc: "Hurst exponent" },
  { k: "Jerk", v: "0.15", desc: "MAD + lag-1" },
  { k: "Jerk Spectrum", v: "0.71", desc: "1/f scaling" },
  { k: "PES Score", v: "0.94", desc: "Composite" },
  { k: "ZK Hash", v: "0x7f3a...b2e1", desc: "SHA-256" },
];

const ATTACK_SUMMARY = [
  { class: "A — Generative AI", severity: "Critical" as const, success: "~0%", detection: "Frequency entropy collapse" },
  { class: "B — Replay", severity: "High" as const, success: "Near zero", detection: "Uniform inter-frame timing" },
  { class: "C — Sensor Spoof", severity: "Medium" as const, success: "Very low", detection: "Multi-dim corroboration" },
];

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-white/30 text-[11px] tracking-[0.4em] uppercase mb-6 text-center hover:text-[#90c8ff]/50 transition-colors cursor-default"
      onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
      {children}
    </h2>
  );
}

export default function EvidenceClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30">
      <ProtocolHeader />

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16 space-y-16 md:space-y-20">
        <div className="text-center">
          <div className="text-[#90c8ff]/60 text-[10px] md:text-[11px] tracking-[0.4em] md:tracking-[0.5em] uppercase mb-6"
            onMouseEnter={() => playTick(500, "sine", 0.05, 0.01)}>PROTOCOL_EVIDENCE // V1.0_GENESIS</div>
          <h1 className="text-3xl md:text-5xl font-light tracking-[0.08em] text-white mb-4">Show Me</h1>
          <p className="text-white/40 md:text-white/45 text-[11px] md:text-[13px] max-w-xl mx-auto leading-relaxed font-light">
            Verifiable proof that MyShape Protocol distinguishes human presence from synthetic simulation.
            Every claim on this page is reproducible.
          </p>
        </div>

        {/* ── 1. PES Benchmark ── */}
        <section>
          <SectionHeading>PES Benchmark Results</SectionHeading>
          <div className="max-w-lg mx-auto border border-[#90c8ff]/15 bg-[#90c8ff]/[0.02] p-6"
            onMouseEnter={() => playTick(550, "sine", 0.05, 0.012)}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="p-3 text-white/18 text-[9px] tracking-[0.2em] uppercase font-normal">Test Case</th>
                  <th className="p-3 text-white/18 text-[9px] tracking-[0.2em] uppercase font-normal">PES</th>
                  <th className="p-3 text-white/18 text-[9px] tracking-[0.2em] uppercase font-normal text-right">Verdict</th>
                </tr>
              </thead>
              <tbody>
                {BENCHMARKS.map((b) => (
                  <tr key={b.test} className="border-b border-white/[0.03] transition-colors cursor-default group/row"
                    onMouseEnter={e => { playTick(600, "sine", 0.06, 0.012); e.currentTarget.style.background = "rgba(144,200,255,0.04)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                    <td className="p-3 text-white/40 group-hover/row:text-white/65 text-[11px] transition-colors">{b.test}</td>
                    <td className={`p-3 font-mono text-[13px] text-[#90c8ff]/80 group-hover/row:text-[#90c8ff] transition-colors ${b.glow}`}>{b.score}</td>
                    <td className={`p-3 text-[10px] text-right font-mono font-bold ${b.accent} group-hover/row:brightness-125 transition-all`}>{b.verdict}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-5 pt-4 border-t border-white/[0.05] flex justify-between text-[9px]">
              <span className="text-white/18">Human—AI Gap</span>
              <span className="text-[#90c8ff]/70 font-mono text-[14px] font-light">0.3960</span>
            </div>
          </div>
          <p className="text-white/14 text-[8px] text-center mt-3 tracking-[0.12em]">
            Source: myshape-demo CLI &middot; Rust core engine &middot; 25/25 tests pass
          </p>
        </section>

        {/* ── 2. Identity Vector + Attack ── */}
        <section className="grid md:grid-cols-2 gap-8">
          <div>
            <SectionHeading>Identity Vector Sample</SectionHeading>
            <div className="border border-[#90c8ff]/15 bg-[#90c8ff]/[0.02] p-5 space-y-1"
              onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
              {VECTOR_SAMPLE.map(({ k, v, desc }) => (
                <div key={k} className="flex items-center justify-between p-2.5 border border-white/[0.04] transition-all cursor-default group/v"
                  onMouseEnter={e => { playTick(450, "sine", 0.03, 0.008); e.currentTarget.style.borderColor = "rgba(144,200,255,0.3)"; e.currentTarget.style.background = "rgba(144,200,255,0.03)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; e.currentTarget.style.background = "transparent"; }}>
                  <div>
                    <span className="text-white/30 group-hover/v:text-white/55 text-[10px] transition-colors">{k}</span>
                    <span className="text-white/10 group-hover/v:text-white/20 text-[8px] ml-2 transition-colors">{desc}</span>
                  </div>
                  <span className="text-[#90c8ff]/60 group-hover/v:text-[#90c8ff]/90 font-mono text-[11px] transition-colors">{v}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading>Attack Surface Summary</SectionHeading>
            <div className="border border-[#90c8ff]/15 bg-[#90c8ff]/[0.02] p-5 space-y-1.5"
              onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}>
              {ATTACK_SUMMARY.map((a) => (
                <div key={a.class} className="flex items-center gap-3 p-2.5 border border-white/[0.04] transition-all cursor-default group/a"
                  onMouseEnter={e => { playTick(500, "sine", 0.04, 0.01); e.currentTarget.style.borderColor = "rgba(144,200,255,0.25)"; e.currentTarget.style.background = "rgba(144,200,255,0.03)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; e.currentTarget.style.background = "transparent"; }}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${a.severity === "Critical" ? "bg-[#90c8ff] shadow-[0_0_10px_rgba(144,200,255,0.6)]" : a.severity === "High" ? "bg-[#90c8ff] shadow-[0_0_8px_rgba(144,200,255,0.4)]" : "bg-[#90c8ff]/60 shadow-[0_0_4px_rgba(144,200,255,0.2)]"}`} />
                  <div className="flex-1">
                    <span className="text-white/35 group-hover/a:text-white/55 text-[10px] transition-colors">{a.class}</span>
                    <span className="text-white/12 group-hover/a:text-white/22 text-[8px] ml-2 transition-colors">{a.detection}</span>
                  </div>
                  <span className="text-[#90c8ff]/55 group-hover/a:text-[#90c8ff]/85 font-mono text-[10px] font-bold transition-colors">{a.success}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 3. Live Verification ── */}
        <section>
          <SectionHeading>Live Verification Engine</SectionHeading>
          <VerificationDashboard />
        </section>

        {/* ── CTA ── */}
        <section className="text-center py-10 border-t border-white/[0.05] space-y-5">
          <p className="text-white/25 text-[11px]">All evidence is reproducible. Run the benchmarks yourself.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/motion-demo"
              onMouseEnter={() => playTick(800, "sine", 0.10, 0.025)}
              className="px-9 py-3 border border-[#90c8ff]/30 text-[#90c8ff]/70 text-[10px] tracking-[0.3em] uppercase hover:bg-[#90c8ff]/[0.04] hover:text-white transition-all"
              style={{ clipPath: "polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)", background: "rgba(144,200,255,0.03)" }}>
              Try Live Demo →
            </Link>
            <Link href="/papers/threat-model"
              onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
              className="px-9 py-3 border border-[#90c8ff]/20 text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase hover:border-[#90c8ff]/35 hover:text-[#90c8ff]/70 transition-all">
              Full Threat Model →
            </Link>
            <Link href="/whitepaper"
              onMouseEnter={() => playTick(700, "sine", 0.08, 0.02)}
              className="px-9 py-3 border border-[#90c8ff]/20 text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase hover:border-[#90c8ff]/35 hover:text-[#90c8ff]/70 transition-all">
              Whitepaper →
            </Link>
          </div>
        </section>
      </div>

      <ProtocolFooter />
    </div>
  );
}
