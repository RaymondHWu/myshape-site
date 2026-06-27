"use client";
import ProtocolHeader from "@/components/header/header";

import ProtocolFooter from "@/components/footer/footer";
import { playTick } from "@/utils/useAudioTick";
import Typewriter from "@/components/ui/Typewriter";

const hoverOn = (e: React.MouseEvent<HTMLElement>) => {
  const kids = e.currentTarget.querySelectorAll<HTMLElement>('[data-hover]');
  kids.forEach(k => { k.style.color = k.dataset.hover || ''; });
};
const hoverOff = (e: React.MouseEvent<HTMLElement>) => {
  const kids = e.currentTarget.querySelectorAll<HTMLElement>('[data-hover]');
  kids.forEach(k => { k.style.color = k.dataset.default || ''; });
};

const PAPERS = [
  {
    title: "Technical Specification v1",
    path: "/papers/technical-spec",
    desc: "Motion Vector format, PES engine, SST topology, proof system, and reference implementation.",
    tags: ["Technical Spec", "V1.0"],
    author: "MyShape Protocol · June 2026",
  },
  {
    title: "Threat Model",
    path: "/papers/threat-model",
    desc: "8 attack signatures, entropy gap theorem, cost model, and defense-in-depth architecture.",
    tags: ["Security Analysis", "V1.0"],
    author: "MyShape Protocol · June 2026",
  },
  {
    title: "Core Protocol",
    path: "/civ-layer/papers/core-protocol",
    desc: "Motion-Based Identity, ZK-Presence, manifold projection, and the cryptographic foundations of geometric identity.",
    tags: ["Whitepaper", "V2.1"],
    author: "MyShape Protocol · 2026",
  },
  {
    title: "Protocol Architecture",
    path: "/civ-layer/papers/protocol-architecture",
    desc: "Five-layer architecture: Capture → Geometry → Integrity → Proof → Identity. Security boundaries and data flow.",
    tags: ["Architecture", "V1.0"],
    author: "MyShape Protocol · 2026",
  },
  {
    title: "Civilization Roadmap",
    path: "/civ-layer/papers/civilization-roadmap",
    desc: "Four-epoch roadmap spanning 20+ years. From geometry to civilization.",
    tags: ["Vision", "V1.0"],
    author: "MyShape Protocol · 2026",
  },
  {
    title: "Papers Manifesto",
    path: "/civ-layer/papers/manifesto",
    desc: "The philosophical foundations: why motion, why geometry, why zero-knowledge.",
    tags: ["Philosophy", "V1.0"],
    author: "MyShape Protocol · 2026",
  },
];

export default function PapersHubClient() {
  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono selection:bg-cyan-500/30">
      <ProtocolHeader />
      

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 pt-24 md:pt-28 pb-16">
        <div className="space-y-4 mb-14">
          <div className="text-cyan-500/50 text-[10px] tracking-[0.5em] uppercase">RESEARCH_&_DOCUMENTATION</div>
          <h1 className="text-3xl md:text-4xl font-light tracking-[0.15em] text-white uppercase">Papers</h1>
          <p className="text-white/40 text-[12px] leading-relaxed max-w-xl">
            Technical documentation, security analysis, and architectural specifications
            for the MyShape Protocol.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PAPERS.map((p) => (
            <a key={p.path} href={p.path}
              onMouseEnter={e => { playTick(600, "sine", 0.10, 0.02); hoverOn(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.35)"; }}
              onMouseLeave={e => { hoverOff(e); e.currentTarget.style.borderColor = "rgba(144,200,255,0.1)"; }}
              className="group block p-6 transition-all duration-500"
              style={{ border: "1px solid rgba(144,200,255,0.1)", background: "transparent" }}>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {p.tags.map((t) => (
                  <span key={t} className="text-[8px] tracking-[0.15em] uppercase px-2 py-0.5 border border-cyan-400/10" style={{ color: "rgba(34,211,238,0.3)" }}>{t}</span>
                ))}
              </div>
              <h3 className="text-[11px] tracking-[0.2em] uppercase mb-2" style={{ color: "rgba(255,255,255,0.6)" }} data-default="rgba(255,255,255,0.6)" data-hover="rgba(255,255,255,0.95)">
                {p.title}
              </h3>
              <p className="text-[10px] leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.25)" }} data-default="rgba(255,255,255,0.25)" data-hover="rgba(255,255,255,0.5)">{p.desc}</p>
              <p className="text-[8px] tracking-[0.08em] mb-2" style={{ color: "rgba(255,255,255,0.12)" }}>{p.author}</p>
              <span className="inline-block text-[10px]" style={{ color: "rgba(34,211,238,0.3)" }} data-default="rgba(34,211,238,0.3)" data-hover="rgba(34,211,238,0.7)">→</span>
            </a>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Typewriter text="All papers are living documents. Updated as the protocol evolves." className="text-white/40 text-[10px] tracking-[0.15em]" />
        </div>
      </div>

      <ProtocolFooter />
    </div>
  );
}
