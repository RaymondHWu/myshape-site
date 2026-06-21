"use client";
import React from 'react';
import Link from 'next/link';
import ProtocolLayout from "@/components/layout/ProtocolLayout";

export default function CivVision() {
  const visionPillars = [
    { id: "PIL_01", title: "AI-NATIVE IDENTITY", desc: "Creating a verifiable bridge between human kinetic energy and artificial intelligence agents." },
    { id: "PIL_02", title: "SPATIAL SOVEREIGNTY", desc: "Establishing the right to remain private within increasingly immersive 3D digital environments." },
    { id: "PIL_03", title: "DATA PERMANENCE", desc: "Ensuring your motion-signature remains yours across the shifting sands of platforms and servers." }
  ];

  return (
    <ProtocolLayout 
      refId="006" 
      category="CIV_LAYER" 
      title="VISION" 
      secLevel="CLASS_OMEGA" 
      systemStatus="FUTURE_STAMP"
    >
      {/* 使用 pb-32 確保內容與底部的 Footer 保持足夠距離 */}
      <div className="space-y-32 pb-32 px-4 md:px-10">
        
        {/* --- 1. CORE VISION & THE EYE --- */}
        <section className="relative pt-20">
          <div className="text-cyan-500/10 text-[100px] md:text-[180px] font-bold absolute -top-10 -left-6 select-none pointer-events-none font-mono tracking-tighter">EYE</div>
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-extralight tracking-[0.5em] text-white leading-tight uppercase mb-10">
              Beyond Surveillance, <br/>
              Towards <span className="text-cyan-400">Expression</span>.
            </h2>
            <p className="text-white/60 text-lg md:text-xl tracking-[0.15em] leading-relaxed font-light max-w-3xl">
              We envision a future where the digital version of yourself is as authentic, 
              private, and sovereign as your physical form. 
            </p>
          </div>
        </section>

        {/* --- 2. THE 2026 WINDOW --- */}
        <section className="relative p-10 border-l border-cyan-500/30 bg-white/[0.01]">
          <div className="flex flex-col md:flex-row gap-12 items-start">
            <div className="shrink-0">
              <div className="text-cyan-400 font-mono text-xs tracking-[0.4em] mb-4">TIME_WINDOW_ANALYSIS</div>
              <div className="text-white text-5xl font-bold font-mono tracking-tighter">2026</div>
            </div>
            <div className="flex-1 space-y-6">
              <h3 className="text-white/80 text-[14px] tracking-[0.3em] uppercase font-bold">The Collision of Intelligence</h3>
              <p className="text-white/40 text-sm tracking-[0.15em] leading-loose uppercase">
                2026 represents the singularity where ambient intelligence surpasses human surveillance capabilities. 
                Static identity is no longer a defense; it is a vulnerability. MyShape is the only protocol 
                designed to transform this collapse into the next stage of human expression.
              </p>
            </div>
          </div>
        </section>

        {/* --- 3. VISION PILLARS --- */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {visionPillars.map((pillar) => (
            <div key={pillar.id} className="group border-b border-white/5 pb-12 hover:border-cyan-500/30 transition-all duration-700">
              <div className="text-cyan-500 text-[10px] tracking-[0.4em] font-bold mb-4 opacity-50 group-hover:opacity-100">{pillar.id}</div>
              <h4 className="text-white text-[14px] tracking-[0.3em] font-bold uppercase mb-6 group-hover:text-cyan-400 transition-colors">{pillar.title}</h4>
              <p className="text-white/30 text-[10px] tracking-[0.2em] leading-loose uppercase group-hover:text-white/50">{pillar.desc}</p>
            </div>
          ))}
        </section>

        {/* --- 4. PROTOCOL BRIDGE --- */}
        <section className="max-w-4xl mx-auto text-center space-y-8">
          <div className="h-px w-24 bg-cyan-500/50 mx-auto" />
          <p className="text-white/80 text-base md:text-lg tracking-[0.2em] leading-relaxed uppercase px-6">
            To realize this future, MyShape introduces a <span className="text-cyan-400 font-bold">motion-native identity protocol</span>—a geometric anchor that 
            separates your human existence from the algorithmic extraction of platforms.
          </p>
          <div className="h-px w-24 bg-cyan-500/50 mx-auto" />
        </section>

        {/* --- 5. SCALE EXPECTATION --- */}
        <section className="py-20 flex flex-col items-center">
            <div className="text-white/10 text-[9px] tracking-[0.8em] uppercase mb-12 italic">// ARCHITECTURE_SCALING_TARGETS</div>
            <div className="flex flex-col md:flex-row items-end gap-2 w-full max-w-2xl opacity-60">
               <div className="flex-1 space-y-4 w-full">
                 <div className="h-8 bg-white/5 border border-white/10 w-full" />
                 <div className="text-[8px] text-white/30 text-center tracking-widest uppercase italic">Initial_Nodes</div>
               </div>
               <div className="flex-1 space-y-4 w-full">
                 <div className="h-24 bg-cyan-500/10 border border-cyan-500/20 w-full" />
                 <div className="text-[8px] text-cyan-500/30 text-center tracking-widest uppercase italic">1M_MESH_SYST</div>
               </div>
               <div className="flex-1 space-y-4 w-full">
                 <div className="h-48 bg-cyan-500/30 border border-cyan-500/50 w-full relative group">
                    <div className="absolute inset-0 bg-cyan-400 animate-pulse opacity-20" />
                 </div>
                 <div className="text-[8px] text-cyan-400 text-center tracking-[0.4em] uppercase font-bold">Global_Identity_Layer</div>
               </div>
            </div>
        </section>

        {/* --- 6. PHILOSOPHICAL QUOTE & LINK --- */}
        <section className="py-20 border-y border-white/5 text-center space-y-12">
            <p className="text-white/80 text-[11px] md:text-xs tracking-[0.3em] leading-loose uppercase italic max-w-xl mx-auto px-6">
              "The history of identity is the history of control. The future of identity is the history of movement."
            </p>
            {/* ⚠️ 路徑修正：從 /publication 改為 /vision/manifesto */}
            <Link href="/civ-layer/vision/manifesto" className="inline-block group">
               <div className="px-16 py-6 border border-cyan-500/30 bg-cyan-500/5 group-hover:bg-cyan-400 group-hover:text-black transition-all duration-500 text-cyan-400 text-[11px] tracking-[0.6em] uppercase font-bold">
                 Access Full Strategic Manifesto →
               </div>
            </Link>
        </section>
      </div>
    </ProtocolLayout>
  );
}