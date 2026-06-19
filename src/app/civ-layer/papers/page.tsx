"use client";
import React from 'react';
import Link from 'next/link';
import ProtocolLayout from "@/components/layout/ProtocolLayout";

export default function PapersPage() {
  const academicPapers = [
    { 
      id: "PAPER_01", 
      tag: "CORE_PROTOCOL", 
      title: "MyShape: A Geometric Approach to Decoupled Digital Identity", 
      version: "V2.1",
      abstract: "The foundational whitepaper defining the motion-to-geometry pipeline and ZK-verification architecture.",
      locked: false 
    },
    { 
      id: "PAPER_02", 
      tag: "ZK_SNARKs", 
      title: "Succinct Proofs of Biological Motion: Efficiency and Security", 
      version: "V1.0-STABLE",
      abstract: "Analyzing the computational overhead of generating ZK-SNARKs on local edge devices for motion capture.",
      locked: true 
    },
    { 
      id: "PAPER_03", 
      tag: "CIV_SOCIOLOGY", 
      title: "The Post-Account Civilization: Identity in the Age of Total Simulation", 
      version: "DRAFT_B",
      abstract: "An exploration of social trust models when human and AI behaviors become indistinguishable.",
      locked: true 
    }
  ];

  return (
    <ProtocolLayout 
      refId="007" 
      category="CIV_LAYER" 
      title="PAPERS" 
      secLevel="CLASS_B" 
      systemStatus="STABLE_RECON"
    >
      <div className="space-y-32 pb-32 px-4 md:px-10">
        
        {/* --- 1. TOP HEADER --- */}
        <section className="max-w-3xl pt-20">
          <h2 className="text-white/30 text-[10px] tracking-[0.6em] uppercase mb-8 flex items-center gap-4">
            <span className="w-8 h-[1px] bg-cyan-500/50" />
            Research_Repository
          </h2>
          <p className="text-xl md:text-3xl font-light tracking-[0.15em] text-white leading-relaxed">
            The MyShape protocol is built upon <span className="text-cyan-400">peer-reviewed foundations</span>.
          </p>
          <p className="mt-8 text-white/50 text-sm tracking-widest leading-loose font-light">
            Our research spans computer vision, zero-knowledge cryptography, and digital sociology. 
          </p>
        </section>

        {/* --- 2. PAPERS LIST (Cards) --- */}
        <section className="space-y-8">
          <h3 className="text-white/20 text-[9px] tracking-[0.5em] uppercase mb-10 italic">// ARCHIVE_INDEX_RECON</h3>
          <div className="space-y-6">
            {academicPapers.map((paper) => (
              <div key={paper.id} className="group relative border border-white/5 bg-white/[0.02] p-8 hover:border-cyan-500/20 transition-all duration-500">
                <div className="absolute top-0 right-0 w-12 h-12 bg-cyan-500/5 clip-path-slant group-hover:bg-cyan-500/10 transition-all" />
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 relative z-10">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center gap-4">
                      <span className="text-cyan-500 text-[10px] tracking-[0.2em] font-bold">[{paper.id}]</span>
                      <span className="text-white/20 text-[9px] tracking-[0.3em] font-mono">#{paper.tag}</span>
                    </div>
                    <h4 className="text-white text-base md:text-lg tracking-[0.2em] font-light group-hover:text-cyan-400 transition-colors uppercase">
                      {paper.title}
                    </h4>
                    <p className="text-white/30 text-[11px] tracking-widest leading-relaxed uppercase max-w-2xl">
                      {paper.abstract}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-6 min-w-[120px]">
                    <span className="text-[9px] text-white/40 border border-white/10 px-3 py-1 bg-white/5">
                      REV_{paper.version}
                    </span>
                    {paper.locked ? (
                      <div className="text-[8px] text-white/10 tracking-[0.3em] font-bold uppercase">Encrypted_Access</div>
                    ) : (
                      <a href={`/papers/${paper.id === "PAPER_01" ? "core-protocol" : "protocol"}`} className="text-cyan-500 hover:text-white text-[10px] tracking-[0.4em] uppercase font-bold transition-all flex items-center gap-2 group/btn">
                        <span>READ_PAPER</span>
                        <span className="group-hover/btn:translate-x-1 transition-transform">→</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- 3. THE MAIN ACTION BUTTON (與 Genesis/Vision 統一) --- */}
        <section className="py-20 border-y border-white/5 text-center space-y-12">
            <p className="text-white/80 text-[11px] md:text-xs tracking-[0.3em] leading-loose uppercase italic max-w-xl mx-auto px-6">
              "The MyShape protocol documentation provides the mathematical and philosophical framework for sovereign human interaction."
            </p>
            
            {/* 這裡就是你說的大按鈕框 */}
            <Link href="/civ-layer/papers/manifesto" className="inline-block group">
               <div className="px-16 py-6 border border-cyan-500/30 bg-cyan-500/5 group-hover:bg-cyan-400 group-hover:text-black transition-all duration-500 text-cyan-400 text-[11px] tracking-[0.6em] uppercase font-bold">
                 Access Full Research Manifesto →
               </div>
            </Link>
        </section>

        {/* --- 4. CONTRIBUTION SECTION --- */}
        <section className="bg-cyan-500/[0.03] border-l-2 border-cyan-500 p-10">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
            <p className="text-white/60 text-[10px] tracking-[0.3em] uppercase leading-relaxed max-w-xl">
              Are you an academic researcher? We provide grants for independent verification 
              of the motion-geometry pipeline.
            </p>
            <div className="text-right shrink-0">
              <span className="block text-white text-[10px] tracking-[0.4em] font-bold mb-2 uppercase">Research_Network</span>
              <span className="block text-cyan-500/40 text-[9px] tracking-[0.2em]">CONTACT@MYSHAPE.COM</span>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`.clip-path-slant { clip-path: polygon(100% 0, 0 0, 100% 100%); }`}</style>
    </ProtocolLayout>
  );
}