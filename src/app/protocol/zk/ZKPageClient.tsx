"use client";
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import { playTick } from "@/utils/useAudioTick";

const hoverOn = (e: React.MouseEvent<HTMLElement>) => {
  const kids = e.currentTarget.querySelectorAll<HTMLElement>('[data-hover]');
  kids.forEach(k => { k.style.color = k.dataset.hover || ''; });
};
const hoverOff = (e: React.MouseEvent<HTMLElement>) => {
  const kids = e.currentTarget.querySelectorAll<HTMLElement>('[data-hover]');
  kids.forEach(k => { k.style.color = k.dataset.default || ''; });
};

const PROOF_LAYERS = [
  {
    id: "PoP",
    name: "Presence Proof",
    desc: "H(Feature Vector) — proves the motion data carries valid geometric structure. The smallest verifiable unit of presence.",
    color: "cyan",
  },
  {
    id: "MP",
    name: "Motion Proof",
    desc: "H(FPS, window, nodes, timestamp, device_salt) — proves the data came from real hardware within a valid time window.",
    color: "blue",
  },
  {
    id: "EP",
    name: "Entropy Proof",
    desc: "H(PES, H_f, σ_timing, ε) — proves the signal exceeds biological entropy floor and is below AI ceiling.",
    color: "indigo",
  },
];

const VERIFICATION_RULES = [
  { rule: 1, name: "ZKP Validity", desc: "Recomputed root hash must match submitted proof" },
  { rule: 2, name: "Entropy Threshold", desc: "PES ≥ 0.65 — below this, presence is not confirmed" },
  { rule: 3, name: "Timestamp Validity", desc: "Proof must be within valid time window, not expired" },
  { rule: 4, name: "Replay Protection", desc: "PoP hash, timestamp, and device salt must be unique" },
  { rule: 5, name: "Device Revocation", desc: "Device must not appear in revocation registry" },
  { rule: 6, name: "Proof Integrity", desc: "All three sub-proofs must be version-consistent and match" },
];

export default function ZKPage() {
  return (
    <ProtocolLayout
      refId="004"
      category="PROTOCOL_CORE"
      title="ZERO_KNOWLEDGE"
      secLevel="CLASS_A"
      systemStatus="ENCRYPTED"
    >
      <div className="space-y-20 md:space-y-28">
        {/* ── 核心声明 ── */}
        <section className="max-w-3xl">
          <h2 className="text-white/30 text-[10px] tracking-[0.6em] uppercase mb-8 flex items-center gap-4">
            <span className="w-8 h-[1px] bg-gradient-to-r from-cyan-500/60 to-transparent" />
            Core_Principle
          </h2>
          <p className="text-xl md:text-2xl font-light tracking-widest text-white leading-relaxed">
            Prove <span className="text-cyan-300/90">presence</span> without revealing{" "}
            <span className="text-cyan-300/90">identity</span>.
          </p>
          <p className="mt-6 text-white/40 text-sm tracking-widest leading-loose font-light">
            The MyShape proof system generates three independent cryptographic proofs —
            Presence, Motion, and Entropy — and composes them into a single Zero-Knowledge
            Presence proof. The verifier learns only one bit: "real human present." Nothing else.
          </p>
        </section>

        {/* ── 三层证明架构 ── */}
        <section>
          <h2 className="text-white/20 text-[10px] tracking-[0.5em] uppercase mb-10 text-center">Three-Proof Architecture</h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {PROOF_LAYERS.map((p, i) => (
              <div key={p.id} className="relative p-6 group transition-all duration-500"
                style={{ border: "1px solid rgba(144,200,255,0.1)", background: "transparent" }}
                onMouseEnter={e => { playTick(700, "sine", 0.08, 0.02); hoverOn(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
                onMouseLeave={e => { hoverOff(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}>
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 flex items-center justify-center border border-cyan-500/20 text-cyan-400/70 font-mono text-[12px] tracking-[0.2em] shrink-0">
                    {p.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] tracking-[0.3em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.7)" }} data-default="rgba(255,255,255,0.7)" data-hover="rgba(255,255,255,0.95)">{p.name}</div>
                    <div className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.25)" }} data-default="rgba(255,255,255,0.25)" data-hover="rgba(255,255,255,0.5)">{p.desc}</div>
                  </div>
                  {i < PROOF_LAYERS.length - 1 && (
                    <div className="hidden md:flex items-center text-cyan-400/20 text-lg">↓</div>
                  )}
                </div>
              </div>
            ))}
            {/* ZKP composite */}
            <div className="relative border p-6 text-center transition-all duration-500"
              style={{ borderColor: "rgba(144,200,255,0.15)", background: "transparent", boxShadow: "0 0 30px rgba(34,211,238,0.06)" }}
              onMouseEnter={e => { playTick(600, "sine", 0.06, 0.015); hoverOn(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
              onMouseLeave={e => { hoverOff(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.15)"; }}>
              <div className="text-[9px] tracking-[0.5em] uppercase mb-3" style={{ color: "rgba(34,211,238,0.5)" }} data-default="rgba(34,211,238,0.5)" data-hover="rgba(34,211,238,0.9)">Composite Proof</div>
              <div className="text-[14px] tracking-[0.4em] uppercase font-light"
                style={{ color: "rgba(165,243,252,0.8)", textShadow: "0 0 12px rgba(34,211,238,0.3)" }} data-default="rgba(165,243,252,0.8)" data-hover="rgba(165,243,252,1)">
                ZK-Presence = ZK(PoP, MP, EP)
              </div>
              <div className="text-[9px] tracking-[0.2em] mt-2" style={{ color: "rgba(255,255,255,0.2)" }} data-default="rgba(255,255,255,0.2)" data-hover="rgba(255,255,255,0.4)">128-512 bytes · verifiable in &lt;1ms · platform-agnostic</div>
            </div>
          </div>
        </section>

        {/* ── 六条验证规则 ── */}
        <section>
          <h2 className="text-white/20 text-[10px] tracking-[0.5em] uppercase mb-8 text-center">Six Verification Rules (§9.4)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {VERIFICATION_RULES.map((r) => (
              <div key={r.rule} className="border p-5 group transition-all duration-500"
                style={{ borderColor: "rgba(144,200,255,0.1)", background: "transparent" }}
                onMouseEnter={e => { playTick(600, "sine", 0.06, 0.015); hoverOn(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
                onMouseLeave={e => { hoverOff(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-5 h-5 flex items-center justify-center border border-cyan-500/30 text-cyan-400/60 font-mono text-[9px]">
                    {r.rule}
                  </span>
                  <span className="text-[11px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.6)" }} data-default="rgba(255,255,255,0.6)" data-hover="rgba(255,255,255,0.9)">{r.name}</span>
                </div>
                <div className="text-[9px] leading-relaxed" style={{ color: "rgba(255,255,255,0.25)" }} data-default="rgba(255,255,255,0.25)" data-hover="rgba(255,255,255,0.5)">{r.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 隐私保证 ── */}
        <section className="border p-10 text-center transition-all duration-500"
          style={{ borderColor: "rgba(144,200,255,0.1)", background: "transparent" }}
          onMouseEnter={e => { playTick(500, "sine", 0.04, 0.01); hoverOn(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
          onMouseLeave={e => { hoverOff(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}>
          <div className="text-[9px] tracking-[0.6em] uppercase mb-6" style={{ color: "rgba(255,255,255,0.3)" }} data-default="rgba(255,255,255,0.3)" data-hover="rgba(255,255,255,0.6)">Privacy Guarantees</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-[10px] tracking-[0.15em] mb-2" style={{ color: "rgba(34,211,238,0.6)" }} data-default="rgba(34,211,238,0.6)" data-hover="rgba(34,211,238,0.95)">Reveals Nothing</div>
              <div className="text-[10px] tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.2)" }} data-default="rgba(255,255,255,0.2)" data-hover="rgba(255,255,255,0.45)">No motion data · No identity · No behavior · No device info</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.15em] mb-2" style={{ color: "rgba(34,211,238,0.6)" }} data-default="rgba(34,211,238,0.6)" data-hover="rgba(34,211,238,0.95)">Stores Nothing</div>
              <div className="text-[10px] tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.2)" }} data-default="rgba(255,255,255,0.2)" data-hover="rgba(255,255,255,0.45)">No raw signals · No feature vectors · No personal data</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.15em] mb-2" style={{ color: "rgba(34,211,238,0.6)" }} data-default="rgba(34,211,238,0.6)" data-hover="rgba(34,211,238,0.95)">Leaks Nothing</div>
              <div className="text-[10px] tracking-[0.15em]" style={{ color: "rgba(255,255,255,0.2)" }} data-default="rgba(255,255,255,0.2)" data-hover="rgba(255,255,255,0.45)">No inference possible · No statistical attack surface</div>
            </div>
          </div>
        </section>
      </div>
    </ProtocolLayout>
  );
}
