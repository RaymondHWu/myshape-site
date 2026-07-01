"use client";
import React from 'react';
import ProtocolLayout from "@/components/layout/ProtocolLayout";
import { playTick } from "@/utils/useAudioTick";

const FOUNDATION = [
  {
    name: "BIOLOGICAL SOVEREIGNTY",
    status: "IMMUTABLE",
    desc: "Your motion is a physical signature — unique, irreproducible, sovereign. No authority can revoke what physics verifies.",
    detail: "The philosophical root: identity as a property of existence, not a grant from institutions.",
    accent: "from-[#90c8ff]/70 to-[#90c8ff]/0",
  },
  {
    name: "KINEMATIC PRIVACY",
    status: "ENCRYPTED",
    desc: "Raw motion data never leaves the device. Only the derived proof is transmitted — not the motion itself.",
    detail: "The security root: ZK-Presence means proving you are human without revealing how you move.",
    accent: "from-blue-400/70 to-blue-400/0",
  },
  {
    name: "ZK-PRESENCE",
    status: "ACTIVE",
    desc: "Zero-knowledge proof of human presence. Verifiable by any third party without access to raw sensor data.",
    detail: "The proof layer: PoP + MP + EP composite — 128-dimensional cryptographic identity vector.",
    accent: "from-[#90c8ff]/70 to-[#90c8ff]/0",
  },
];

const EXTENSION = [
  {
    name: "TEMPORAL RECORD",
    status: "STREAMING",
    desc: "Continuous verification over time. Not a snapshot. A stream of proof that accumulates into trust.",
    detail: "The state layer: scan_count, data_contribution, orbital evolution — your presence over time.",
    accent: "from-indigo-400/70 to-indigo-400/0",
  },
  {
    name: "AI-NATIVE EXISTENCE",
    status: "COEXISTING",
    desc: "Identity designed for a world where AI agents and humans coexist. Cross-species verification in one protocol.",
    detail: "The cross-species layer: AGENT_ACTIVE nodes verify alongside GENESIS_NODE — one mesh.",
    accent: "from-violet-400/70 to-violet-400/0",
  },
  {
    name: "NEURAL SYNTHESIS",
    status: "FUTURE",
    desc: "The frontier: integrating deeper biological signals with cryptographic identity primitives.",
    detail: "The expansion layer: beyond skeletal motion toward full neuro-kinetic identity fusion.",
    accent: "from-fuchsia-400/50 to-fuchsia-400/0",
  },
];

export default function IdentityLayer() {
  return (
    <ProtocolLayout
      refId="002"
      category="PROTOCOL_CORE"
      title="IDENTITY_LAYER"
      secLevel="CLASS_A"
      systemStatus="ACTIVE_NODE"
    >
      <div className="space-y-16 md:space-y-28">
        {/* ── 核心锤子句 ── */}
        <section className="max-w-3xl">
          <h2 className="text-white/25 text-[10px] tracking-[0.6em] uppercase mb-8 flex items-center gap-4">
            <span className="w-8 h-[1px] bg-gradient-to-r from-[#90c8ff]/60 to-transparent" />
            Core_Concept
          </h2>
          <p className="text-xl md:text-2xl font-light tracking-widest text-white leading-relaxed">
            In the MyShape ecosystem, identity is not a string of characters, but a{" "}
            <span className="text-[#90c8ff]/90">dynamic geometric expression</span>.
          </p>
          <p className="mt-4 text-[#90c8ff]/60 text-sm tracking-[0.15em] uppercase font-light italic">
            Geometry is distilled into a non-replicable identity vector.
          </p>
          <p className="mt-6 text-white/40 text-sm tracking-widest leading-loose font-light">
            Through the Energy-Presence Model, we translate raw motion data into a
            multi-dimensional visual and cryptographic state. This is the first step
            toward becoming a sovereign data-body.
          </p>
        </section>

        {/* ── 基础层 (Foundation) ── */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <span className="text-white/10 text-[7px] tracking-[0.3em] uppercase border-b border-white/10 pb-1">Foundation</span>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FOUNDATION.map((model) => (
              <IdentityCard key={model.name} model={model} />
            ))}
          </div>
        </section>

        {/* ── 扩展层 (Extension) ── */}
        <section>
          <div className="flex items-center gap-3 mb-8">
            <span className="text-white/10 text-[7px] tracking-[0.3em] uppercase border-b border-white/10 pb-1">Extension</span>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {EXTENSION.map((model) => (
              <IdentityCard key={model.name} model={model} />
            ))}
          </div>
        </section>

        {/* ── The Geometric Primitive ── */}
        <section className="max-w-3xl">
          <div className="p-6 border border-[#90c8ff]/10 bg-[#90c8ff]/[0.02]">
            <div className="text-[#90c8ff]/40 text-[8px] tracking-[0.3em] uppercase mb-4">The Geometric Primitive</div>
            <p className="text-white/35 text-sm leading-[1.9] font-light">
              2D images are projections. They collapse depth into pixels, discarding the
              spatial relationships that make a motion signature unique. A 3D Motion
              Signature preserves what 2D cannot — forming an irreducible geometric primitive
              that no AI model can reconstruct from flat training data.
            </p>
            <p className="mt-4 text-white/25 text-sm leading-[1.9] font-light">
              The Nyquist limit ensures that 30 fps video cannot resolve dynamics above 15 Hz.
              Depth ambiguity from 2D-to-3D lifting introduces ±10% uncertainty. The sensor
              noise floor sits at the millimeter scale. These are not temporary AI limitations.
              They are laws of physics and information theory.
            </p>
          </div>
        </section>

        {/* ── 底部 Pipeline ── */}
        <section className="text-center border-t border-white/[0.04] pt-12">
          <div className="text-white/10 text-[7px] tracking-[0.3em] uppercase mb-6">Identity Pipeline</div>
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-[10px] tracking-[0.2em] uppercase font-mono">
            <span className="text-white/20 px-3 py-1.5 border border-white/[0.06]">Motion</span>
            <span className="text-[#90c8ff]/15 text-lg">→</span>
            <span className="text-white/20 px-3 py-1.5 border border-white/[0.06]">Geometry</span>
            <span className="text-[#90c8ff]/15 text-lg">→</span>
            <span className="text-white/20 px-3 py-1.5 border border-white/[0.06]">Vector</span>
            <span className="text-[#90c8ff]/15 text-lg">→</span>
            <span className="text-[#90c8ff]/40 px-3 py-1.5 border border-[#90c8ff]/20">Proof</span>
            <span className="text-[#90c8ff]/15 text-lg">→</span>
            <span className="text-[#90c8ff]/50 px-3 py-1.5 border border-[#90c8ff]/30 bg-[#90c8ff]/[0.03]">Presence</span>
          </div>
          <p className="text-white/15 text-[8px] tracking-[0.2em] uppercase mt-6">
            Real-time · On-device · Zero upload · Cryptographically verifiable
          </p>
        </section>
      </div>
    </ProtocolLayout>
  );
}

function IdentityCard({ model }: { model: { name: string; status: string; desc: string; detail: string; accent: string } }) {
  return (
    <div
      onMouseEnter={() => playTick(600, "sine", 0.08, 0.015)}
      className="group relative p-6 md:p-8 transition-all duration-700"
      style={{ border: "1px solid rgba(144,200,255,0.1)", background: "transparent" }}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(144,200,255,0.04) 0%, transparent 60%)" }} />
      <div className={`absolute top-0 left-4 right-4 h-[1px] bg-gradient-to-r ${model.accent} opacity-30 group-hover:opacity-80 transition-opacity duration-700`} />
      <div className="flex justify-between items-start mb-5">
        <h4 className="text-[13px] tracking-[0.3em] font-bold text-white/75 group-hover:text-[#90c8ff]/90 transition-colors duration-500 uppercase">
          {model.name}
        </h4>
        <span className="text-[8px] tracking-[0.2em] uppercase font-mono px-2.5 py-0.5 transition-all duration-500"
          style={{ border: "1px solid rgba(144,200,255,0.25)", color: "rgba(144,200,255,0.55)", textShadow: "0 0 6px rgba(144,200,255,0.15)" }}>
          {model.status}
        </span>
      </div>
      <p className="text-white/45 text-[11px] tracking-[0.15em] uppercase mb-4 font-light italic leading-relaxed">
        {model.desc}
      </p>
      <div className="h-[1px] mb-4 bg-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#90c8ff]/25 to-transparent w-0 group-hover:w-full transition-all duration-700" />
      </div>
      <p className="text-white/20 text-[9px] tracking-[0.1em] leading-relaxed uppercase group-hover:text-white/30 transition-colors duration-500">
        {model.detail}
      </p>
    </div>
  );
}
