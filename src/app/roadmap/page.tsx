"use client";
import React from 'react';
import ProtocolLayout from "@/components/layout/ProtocolLayout";

export default function RoadmapPage() {
  const roadmaps = [
    {
      phase: "PHASE_01",
      name: "GEOMETRY_AWAKENING",
      status: "COMPLETED",
      details: [
        "FORMALIZATION OF THE MOTION-TO-GEOMETRY MATHEMATICAL MODEL.",
        "SUCCESSFUL PROTOTYPING OF LOCAL ZK-SNARK GENERATION ON MOBILE EDGE DEVICES.",
        "ESTABLISHMENT OF THE 'HALO' VISUALIZATION FRAMEWORK."
      ]
    },
    {
      phase: "PHASE_02",
      name: "SYNAPTIC_UPLINK",
      status: "CURRENT",
      details: [
        "CORE PROTOCOL SDK RELEASE FOR UNREAL ENGINE AND UNITY INTEGRATION.",
        "DECENTRALIZED IDENTITY MESH TESTNET LAUNCH.",
        "CROSS-PLATFORM MOTION PASSPORT INITIAL TRIALS."
      ]
    },
    {
      phase: "PHASE_03",
      name: "CIVILIZATION_OVERLAY",
      status: "PENDING",
      details: [
        "AUTONOMOUS IDENTITY AGENTS FOR AI-NATIVE ENVIRONMENTS.",
        "GLOBAL KINETIC CONSENSUS LAYER ACTIVATION.",
        "PERMANENT DATA-BODY SOVEREIGNTY LEGAL FRAMEWORK INTEGRATION."
      ]
    }
  ];

  return (
    <ProtocolLayout 
      refId="010" 
      category="SYS_COMP" 
      title="ROADMAP" 
      secLevel="CLASS_GAMMA" 
      systemStatus="EVOLVING"
    >
      <div className="space-y-32">
        {/* --- 1. 路线图引言：时间的维度 --- */}
        <section className="max-w-4xl">
          <h2 className="text-cyan-500/80 text-[10px] tracking-[0.6em] font-bold uppercase mb-8">// TEMPORAL_SEQUENCE</h2>
          <p className="text-xl md:text-2xl font-light tracking-widest text-white leading-relaxed">
            The evolution of MyShape is not a linear path, but a <span className="text-cyan-400">recursive expansion</span> of human sovereignty.
          </p>
          <p className="mt-8 text-white/50 text-sm tracking-[0.2em] leading-loose font-light">
            We divide our journey into three critical phases. Each phase represents a leap in 
            the protocol's ability to verify, protect, and express the kinetic identity of the human race.
          </p>
        </section>

        {/* --- 2. 阶段性路线图 (完整的详细清单) --- */}
        <section className="relative space-y-px bg-white/10 border border-white/10">
          {roadmaps.map((item) => (
            <div key={item.phase} className="bg-[#02040a] p-12 group hover:bg-cyan-500/[0.02] transition-all">
              <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                {/* 左侧：阶段标识 */}
                <div className="space-y-4 min-w-[200px]">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${item.status === 'COMPLETED' ? 'bg-cyan-500' : item.status === 'CURRENT' ? 'bg-cyan-400 animate-pulse' : 'bg-white/10'}`} />
                    <span className="text-cyan-500 text-[10px] tracking-[0.4em] font-mono">{item.phase}</span>
                  </div>
                  <h3 className="text-white text-lg tracking-[0.3em] font-light uppercase">
                    {item.name}
                  </h3>
                  <div className="text-[9px] text-white/20 tracking-[0.2em] uppercase">
                    STATUS: {item.status}
                  </div>
                </div>

                {/* 右侧：详细任务清单 */}
                <div className="flex-1 space-y-6">
                  {item.details.map((detail, idx) => (
                    <div key={idx} className="flex gap-4 items-start group/item">
                      <span className="text-cyan-500/30 text-[9px] mt-1 group-hover/item:text-cyan-500 transition-colors">▶</span>
                      <p className="text-white/40 text-[10px] md:text-[11px] tracking-widest leading-relaxed uppercase group-hover/item:text-white/70 transition-colors">
                        {detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* --- 3. 找回之前的未来承诺 --- */}
        <section className="p-12 border border-dashed border-white/10 flex flex-col items-center text-center">
          <p className="text-white/20 text-[9px] tracking-[0.8em] uppercase mb-8">End_Of_Document_Temporal_Projection</p>
          <p className="text-white/70 text-sm tracking-[0.3em] uppercase leading-loose max-w-2xl italic">
            "The roadmap is a living protocol. As the AI landscape shifts, MyShape adapts, 
            ensuring the human geometry remains the final authority."
          </p>
          <div className="mt-12 h-px w-24 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        </section>
      </div>
    </ProtocolLayout>
  );
}