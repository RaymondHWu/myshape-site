"use client";
import React from 'react';
import Link from 'next/link'; // 引入 Link
import ProtocolLayout from "@/components/layout/ProtocolLayout";

export default function CivGenesis() {
  const genesisMilestones = [
    { year: "INITIAL_SIG", event: "THE MOMENT BIOLOGICAL MOTION MET CRYPTOGRAPHIC TRUTH." },
    { year: "PROTOCOL_V1", event: "DEFINITION OF THE ENERGY-PRESENCE AS THE SOVEREIGN UNIT." },
    { year: "CIV_EXPANSION", event: "THE ARCHITECTURE FOR THE POST-AI IDENTITY CIVILIZATION." }
  ];

  return (
    <ProtocolLayout 
      refId="005" 
      category="CIV_LAYER" 
      title="GENESIS" 
      secLevel="CLASS_OMEGA" 
      systemStatus="ARCHIVE_CORE"
    >
      <div className="space-y-32">
        {/* --- 1. 创世引言：大格局叙事 --- */}
        <section className="max-w-4xl relative">
          <div className="absolute -left-10 top-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-transparent opacity-30" />
          <h2 className="text-2xl md:text-3xl font-extralight tracking-[0.4em] text-white leading-tight uppercase mb-8">
            The era of <span className="text-cyan-400">Carbon-Silicon</span> convergence requires a new anchor of existence.
          </h2>
          <p className="text-white/50 text-base tracking-[0.2em] leading-relaxed font-light">
            Genesis is not a starting date; it is the fundamental realization that identity 
            must be reclaimed from centralized databases and returned to the kinetic essence of the individual.
          </p>
        </section>

        {/* --- 2. 核心宣言：为什么是现在 --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
          <div className="space-y-6">
            <h3 className="text-cyan-500/80 text-[10px] tracking-[0.6em] font-bold uppercase">// THE_NECESSITY</h3>
            <p className="text-white/40 text-xs tracking-widest leading-loose uppercase">
              As AI models begin to perfectly simulate human behavior, the "Account" model of identity fails. 
              MyShape was conceived to prove human presence through the irreducible geometry of motion.
            </p>
          </div>
          <div className="p-8 border border-white/10 bg-white/[0.01] relative overflow-hidden">
             <div className="absolute top-0 right-0 p-2 text-[8px] text-white/10 font-mono italic">SEC_STAMP_005</div>
             <p className="text-white/70 text-[11px] tracking-[0.2em] leading-relaxed uppercase italic">
               "We do not build a tool. We define the baseline of a new civilization."
             </p>
          </div>
        </section>

        {/* --- 3. 创世里程碑 (Genesis Timeline) --- */}
        <section className="space-y-12">
          <h3 className="text-white/20 text-[9px] tracking-[0.6em] uppercase text-center">// EVOLUTIONARY_PHASES</h3>
          <div className="space-y-px bg-white/5 border border-white/5">
            {genesisMilestones.map((item) => (
              <div key={item.year} className="grid grid-cols-1 md:grid-cols-12 bg-[#02040a] p-8 group hover:bg-cyan-500/[0.03] transition-all">
                <div className="md:col-span-3 text-cyan-500 text-[10px] tracking-[0.4em] font-bold mb-4 md:mb-0">
                  {item.year}
                </div>
                <div className="md:col-span-9 text-white/60 text-[11px] tracking-[0.2em] uppercase group-hover:text-white transition-colors">
                  {item.event}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- 4. 新增：跳轉深度文章按鈕 (Manifesto Link) --- */}
        <section className="flex justify-center pt-10">
           <Link href="/civ-layer/genesis/manifesto" className="group relative px-12 py-6 border border-cyan-500/30 bg-black text-cyan-400 text-[10px] tracking-[0.6em] uppercase hover:bg-cyan-500/10 hover:text-white hover:border-cyan-500 transition-all duration-500">
              Read_Full_Genesis_Manifesto →
              <div className="absolute -inset-1 border border-cyan-500/10 group-hover:border-cyan-500/30 transition-all pointer-events-none" />
           </Link>
        </section>

        {/* --- 5. 底部标志 --- */}
        <div className="flex justify-center opacity-20 pb-10">
          <div className="text-[8px] tracking-[1em] uppercase border-y border-white/20 py-4 px-12">
            Protocol_Origin_Verified
          </div>
        </div>
      </div>
    </ProtocolLayout>
  );
}