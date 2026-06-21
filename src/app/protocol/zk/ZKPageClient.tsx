"use client";
import React from 'react';
import ProtocolLayout from "@/components/layout/ProtocolLayout";

export default function ZKPage() {
  const zkFeatures = [
    { 
      id: "PROOF_GEN", 
      title: "Prover Engine", 
      desc: "Local generation of succinct proofs that motion data matches the identity model." 
    },
    { 
      id: "VERIF_NODE", 
      title: "Verifier Protocol", 
      desc: "Publicly verifiable signatures that confirm identity without accessing raw pixels or skeletons." 
    },
    { 
      id: "PRIV_SHIELD", 
      title: "Privacy Shielding", 
      desc: "Absolute isolation of biological identifiers from the global consensus layer." 
    }
  ];

  return (
    <ProtocolLayout 
      refId="004" 
      category="PROTOCOL_CORE" 
      title="ZERO_KNOWLEDGE" 
      secLevel="CLASS_A" 
      systemStatus="ENCRYPTED"
    >
      <div className="space-y-32">
        {/* --- 1. 核心哲学：验证而不暴露 --- */}
        <section className="max-w-3xl">
          <h2 className="text-white/30 text-[10px] tracking-[0.6em] uppercase mb-8 flex items-center gap-4">
            <span className="w-8 h-[1px] bg-cyan-500/50" />
            Encryption_Paradigm
          </h2>
          <p className="text-xl md:text-2xl font-light tracking-widest text-white leading-relaxed uppercase">
            "To prove the <span className="text-cyan-400">truth</span> without revealing the <span className="text-cyan-400">source</span>."
          </p>
          <p className="mt-8 text-white/50 text-sm tracking-widest leading-loose font-light">
            MyShape utilizes advanced ZK-SNARKs to ensure that your physical existence remains yours alone. 
            The protocol only knows that 'you are you', never 'what you look like'.
          </p>
        </section>

        {/* --- 2. ZK 技术核心特性 (The Shield Grid) --- */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 border border-white/5">
            {zkFeatures.map((feature) => (
              <div key={feature.id} className="bg-[#02040a] p-10 group hover:bg-cyan-500/[0.03] transition-all relative">
                <div className="text-cyan-500/40 text-[9px] tracking-[0.4em] mb-12 font-bold uppercase">
                  {feature.id}
                </div>
                <h3 className="text-white text-[13px] tracking-[0.3em] uppercase mb-6 group-hover:text-cyan-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-white/30 text-[10px] tracking-widest leading-relaxed uppercase">
                  {feature.desc}
                </p>
                {/* 装饰性边角指示器 */}
                <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10 group-hover:border-cyan-500/50 transition-all" />
              </div>
            ))}
          </div>
        </section>

        {/* --- 3. 验证逻辑流 (The Verification Flow) --- */}
        <section className="border border-cyan-500/20 bg-cyan-500/[0.02] p-12">
          <div className="flex flex-col gap-10">
            <div className="flex justify-between items-center border-b border-white/5 pb-6">
              <span className="text-[10px] text-white/60 tracking-[0.5em] uppercase font-bold">Verification_Logic_Flow</span>
              <span className="text-[8px] text-cyan-400 animate-pulse tracking-widest uppercase">Securing_Uplink...</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5 text-center p-4 border border-white/10 text-[10px] tracking-[0.3em] uppercase text-white/40">
                RAW_MOTION_DATA (LOCAL)
              </div>
              <div className="md:col-span-2 text-center text-cyan-500 text-lg">
                →
              </div>
              <div className="md:col-span-5 text-center p-4 border border-cyan-500/40 text-[10px] tracking-[0.3em] uppercase text-cyan-400 font-bold bg-cyan-500/5">
                ZK_PROOF (ON-CHAIN)
              </div>
            </div>

            <p className="text-center text-[9px] text-white/20 tracking-[0.2em] uppercase italic">
              Data isolation confirmed. No leakage detected in current session.
            </p>
          </div>
        </section>
      </div>
    </ProtocolLayout>
  );
}