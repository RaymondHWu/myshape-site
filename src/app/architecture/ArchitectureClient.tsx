"use client";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import { playTick } from "@/utils/useAudioTick";

const PIPELINE = [
  { step: "01", name: "Camera", icon: "◈", desc: "Local webcam input. On-device only. MediaPipe Pose extracts 33 skeletal landmarks. Nothing uploaded — raw frames discarded after processing.", output: "33 Landmarks" },
  { step: "02", name: "Motion", icon: "◎", desc: "SST 18-point topology maps 33→18 key joints. Temporal window captures 128-dim motion vector across 4 feature groups: kinematics, acceleration, jerk, jerk spectrum.", output: "128-dim Vector" },
  { step: "03", name: "Encoding", icon: "◉", desc: "4-dimensional entropy scoring: micro-timing variance, noise residual, frequency entropy, biological perturbation. AI-generated motion fails here — the entropy gap is mathematically provable.", output: "PES Score" },
  { step: "04", name: "Vector", icon: "⬡", desc: "Motion geometry distilled into a compact, non-replicable identity vector. Poseidon-hashed. Non-invertible — you cannot reconstruct motion data from the hash.", output: "Identity Vector" },
  { step: "05", name: "Proof", icon: "◆", desc: "PoP + MP + EP → ZK-Presence composite proof. < 512 bytes. Verifiable in < 1ms. Proves presence without exposing identity or motion data.", output: "ZK-Proof" },
  { step: "06", name: "Agent", icon: "⬢", desc: "Cross-species verification. Human and AI identities coexist in one protocol. Presence Receipt issued — a cryptographic record that an entity proved presence at a specific time.", output: "Presence Receipt" },
];

const THREATS = [
  { attack: "Generative AI", vector: "Synthetic video frames", defense: "4D entropy gap — AI cannot reproduce biological micro-timing", confidence: "0.992" },
  { attack: "Replay Attack", vector: "Recorded motion playback", defense: "Temporal nonce + frame freshness check", confidence: "0.998" },
  { attack: "Imitation", vector: "Human mimicking target motion", defense: "Motion signature is individual — imitation ≠ original", confidence: "0.985" },
  { attack: "Motion Capture", vector: "MoCap data injection", defense: "Sensor noise profile verification", confidence: "0.990" },
  { attack: "Sensor Spoof", vector: "Fake camera feed", defense: "Device attestation + hardware fingerprint", confidence: "0.995" },
  { attack: "Adversarial Pose", vector: "Perturbed landmark input", defense: "Kinematic consistency check — joints must obey biomechanics", confidence: "0.987" },
  { attack: "Statistical", vector: "ML-generated motion stats", defense: "Frequency-domain analysis exposes synthetic patterns", confidence: "0.991" },
];

const ENTROPY_DIMS = [
  { dim: "D1 — Micro-Timing", what: "Inter-frame interval variance at sub-100ms scale", human: "Chaotic. Breathing, fatigue, neural jitter.", ai: "Uniform. Generated frames have consistent timing." },
  { dim: "D2 — Noise Residual", what: "Sensor + environment noise in landmark coordinates", human: "Organic. CMOS noise interacts with real light.", ai: "Absent or synthetic. Perfect coordinates are a red flag." },
  { dim: "D3 — Frequency Entropy", what: "Spectral density across 0.5–15 Hz motion band", human: "Broad spectrum. Multiple overlapping frequencies.", ai: "Narrow peaks. Generated motion has limited frequency range." },
  { dim: "D4 — Biological Perturbation", what: "Involuntary micro-movements (saccades, tremor, drift)", human: "Present. Humans cannot suppress these.", ai: "None. AI does not model involuntary biology." },
];

// Shared hover helper — reads data-default on leave to properly restore React inline styles
const hoverOn = (e: React.MouseEvent<HTMLElement>) => {
  const kids = e.currentTarget.querySelectorAll<HTMLElement>('[data-hover]');
  kids.forEach(k => { k.style.color = k.dataset.hover || ''; });
};
const hoverOff = (e: React.MouseEvent<HTMLElement>) => {
  const kids = e.currentTarget.querySelectorAll<HTMLElement>('[data-hover]');
  kids.forEach(k => { k.style.color = k.dataset.default || ''; });
};

export default function ArchitectureClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30">
      <ProtocolHeader />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16">
        {/* Header */}
        <div className="space-y-3 md:space-y-4 mb-10 md:mb-14">
          <div className="text-cyan-500/50 text-[9px] md:text-[10px] tracking-[0.4em] md:tracking-[0.5em] uppercase">Protocol_Architecture</div>
          <h1 className="text-2xl md:text-4xl font-light tracking-[0.1em] md:tracking-[0.15em] text-white uppercase leading-tight">
            Camera <span className="text-cyan-400/40">→</span> Presence Receipt
          </h1>
          <p className="text-white/35 md:text-white/40 text-[10px] md:text-[12px] leading-relaxed max-w-2xl">
            Six stages. One pipeline. Zero data stored.<br />
            <span className="text-cyan-400/50">Human and AI identities coexist in one protocol.</span>
          </p>
        </div>

        {/* Pipeline */}
        <section className="mb-12 md:mb-16">
          <h2 className="text-white/15 md:text-white/20 text-[8px] md:text-[9px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-6 md:mb-8">// PIPELINE</h2>
          <div className="relative">
            {/* Spine */}
            <div className="hidden md:block absolute left-6 top-8 bottom-8 w-[1px] bg-gradient-to-b from-cyan-400/30 via-cyan-400/15 to-cyan-400/5" />
            <div className="hidden md:block absolute left-[21px] w-[3px] h-12"
              style={{
                background: "linear-gradient(to bottom, transparent, rgba(34,211,238,0.25), transparent)",
                animation: "spineScan 4s ease-in-out infinite",
                filter: "blur(1px)",
              }} />
            <div className="space-y-1 md:space-y-0">
              {PIPELINE.map((p, i) => (
                <div key={p.step} className="relative flex gap-3 md:gap-5 md:pl-10 pb-3 md:pb-8 last:pb-0 group">
                  {/* Node dot — desktop only */}
                  <div className="hidden md:block absolute left-[10px] top-3 w-3 h-3 rounded-full border-2 border-cyan-400/40 bg-[#02040a] z-10 group-hover:border-cyan-300/80 group-hover:shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-all duration-500"
                    style={{
                      boxShadow: "0 0 8px rgba(34,211,238,0.3)",
                      animation: `nodePulse 2.5s ease-in-out ${i * 0.4}s infinite`,
                    }} />
                  <div className="flex-1 p-3 md:p-5 transition-all duration-500"
                    onMouseEnter={e => { playTick(800, "sine", 0.08, 0.02); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; hoverOn(e); }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; hoverOff(e); }}
                    style={{ border: "1px solid rgba(144,200,255,0.1)", background: "transparent" }}>
                    <div className="flex items-center justify-between mb-2 md:mb-3">
                      <div className="flex items-center gap-2 md:gap-3">
                        <span className="font-mono text-[9px] md:text-[10px] tracking-[0.15em] md:tracking-[0.2em]" style={{ color: "rgba(34,211,238,0.4)" }}>{p.step}</span>
                        <span className="text-[11px] md:text-[12px] tracking-[0.15em] md:tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.6)" }} data-default="rgba(255,255,255,0.6)" data-hover="rgba(255,255,255,0.95)">{p.icon} {p.name}</span>
                      </div>
                      <span className="hidden md:inline text-[9px] tracking-[0.1em] font-mono" style={{ color: "rgba(34,211,238,0.25)" }} data-default="rgba(34,211,238,0.25)" data-hover="rgba(34,211,238,0.6)">{p.output}</span>
                    </div>
                    <p className="text-[9px] md:text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }} data-default="rgba(255,255,255,0.35)" data-hover="rgba(255,255,255,0.55)">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4D Entropy — Why AI Fails */}
        <section className="mb-12 md:mb-16">
          <h2 className="text-white/15 md:text-white/20 text-[8px] md:text-[9px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-6 md:mb-8">// 4D_ENTROPY — WHY AI CANNOT PASS</h2>
          <div className="space-y-1 md:space-y-2">
            {ENTROPY_DIMS.map(d => (
              <div key={d.dim} className="p-3 md:p-5 transition-all duration-500"
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}
                style={{ border: "1px solid rgba(144,200,255,0.1)", background: "transparent" }}>
                <div className="text-[10px] md:text-[11px] tracking-[0.15em] uppercase mb-2" style={{ color: "rgba(34,211,238,0.6)" }}>{d.dim}</div>
                <div className="text-[9px] md:text-[10px] mb-2" style={{ color: "rgba(255,255,255,0.3)" }}>{d.what}</div>
                <div className="grid grid-cols-2 gap-3 md:gap-4 text-[8px] md:text-[9px]">
                  <div className="flex gap-1.5">
                    <span className="text-green-400/60 shrink-0">Human:</span>
                    <span style={{ color: "rgba(255,255,255,0.4)" }}>{d.human}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="text-red-400/50 shrink-0">AI:</span>
                    <span style={{ color: "rgba(255,255,255,0.25)" }}>{d.ai}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Threat Matrix */}
        <section className="mb-12 md:mb-16">
          <h2 className="text-white/15 md:text-white/20 text-[8px] md:text-[9px] tracking-[0.5em] md:tracking-[0.6em] uppercase mb-6 md:mb-8">// THREAT_MATRIX — 7 ATTACK VECTORS</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[8px] md:text-[9px]">
              <thead>
                <tr className="border-b border-white/5" style={{ color: "rgba(255,255,255,0.25)" }}>
                  <th className="text-left py-2 pr-3 font-normal tracking-[0.15em] uppercase">Attack</th>
                  <th className="text-left py-2 pr-3 font-normal tracking-[0.15em] uppercase hidden md:table-cell">Vector</th>
                  <th className="text-left py-2 pr-3 font-normal tracking-[0.15em] uppercase">Defense</th>
                  <th className="text-right py-2 font-normal tracking-[0.15em] uppercase">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {THREATS.map(t => (
                  <tr key={t.attack} className="border-b border-white/[0.02] hover:bg-white/[0.01] transition-colors">
                    <td className="py-2.5 pr-3" style={{ color: "rgba(255,255,255,0.55)" }}>{t.attack}</td>
                    <td className="py-2.5 pr-3 hidden md:table-cell" style={{ color: "rgba(255,255,255,0.25)" }}>{t.vector}</td>
                    <td className="py-2.5 pr-3" style={{ color: "rgba(34,211,238,0.5)" }}>{t.defense}</td>
                    <td className="py-2.5 text-right font-mono" style={{ color: "rgba(34,211,238,0.4)" }}>{t.confidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 mt-10 md:mt-14">
          {[
            { label: "Read", title: "Technical Spec", desc: "Full specification", href: "/papers/technical-spec" },
            { label: "Review", title: "Threat Model", desc: "Security analysis", href: "/papers/threat-model" },
            { label: "Build", title: "Developer SDK", desc: "5 lines to integrate", href: "/developers" },
          ].map(card => (
            <a key={card.href} href={card.href}
              onMouseEnter={e => { playTick(900, "sine", 0.10, 0.025); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; e.currentTarget.style.background = "radial-gradient(circle at top left, rgba(144,200,255,0.06) 0%, transparent 70%)"; hoverOn(e); }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; e.currentTarget.style.background = "transparent"; hoverOff(e); }}
              className="block p-4 md:p-5 transition-all duration-500 text-center"
              style={{ border: "1px solid rgba(144,200,255,0.1)", background: "transparent" }}>
              <div className="text-[8px] md:text-[9px] tracking-[0.3em] uppercase mb-1.5 md:mb-2 font-mono" style={{ color: "rgba(34,211,238,0.3)" }} data-default="rgba(34,211,238,0.3)" data-hover="rgba(34,211,238,0.6)">{card.label}</div>
              <div className="text-[10px] md:text-[11px] tracking-[0.2em] uppercase mb-1 md:mb-1.5" style={{ color: "rgba(255,255,255,0.7)" }} data-default="rgba(255,255,255,0.7)" data-hover="rgba(255,255,255,0.95)">{card.title}</div>
              <div className="text-[8px] md:text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }} data-default="rgba(255,255,255,0.25)" data-hover="rgba(255,255,255,0.5)">{card.desc}</div>
              <div className="mt-2 md:mt-3 inline-block text-[10px]" style={{ color: "rgba(34,211,238,0.25)" }} data-default="rgba(34,211,238,0.25)" data-hover="rgba(34,211,238,0.6)">→</div>
            </a>
          ))}
        </section>
      </div>

      <ProtocolFooter />
    </div>
  );
}
