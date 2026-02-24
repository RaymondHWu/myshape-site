"use client";
import React from 'react';
import ProtocolLayout from "@/components/layout/ProtocolLayout";

export default function OverviewPage() {
  const layers = [
    { id: "01", title: "INPUT LAYER", desc: "LOCAL MOTION CAPTURE PRODUCING IRREVERSIBLE BEHAVIOR VECTORS" },
    { id: "02", title: "ZERO-KNOWLEDGE LAYER", desc: "VERIFIABLE IDENTITY WITHOUT EXPOSURE" },
    { id: "03", title: "IDENTITY MODEL LAYER", desc: "HALO, PARTICLE, SCANLINE, FIELD" },
    { id: "04", title: "PROTOCOL LAYER", desc: "ID, PASSPORT, CROSS-PLATFORM IDENTITY" }
  ];

  return (
    <ProtocolLayout 
      refId="001" 
      category="PROTOCOL_CORE" 
      title="OVERVIEW" 
      secLevel="CLASS_A" 
      systemStatus="ACTIVE_NODE"
    >
      <div className="space-y-32">
        {/* --- 头部核心引言 --- */}
        <section className="space-y-8">
          <h2 className="text-xl md:text-2xl font-light tracking-[0.2em] text-white leading-relaxed italic">
            "MyShape Protocol is the sovereign identity layer for the AI era."
          </h2>
          <p className="text-white/50 text-sm tracking-widest leading-loose max-w-3xl">
            It transforms motion geometry into a zero-knowledge identity, expresses identity through an 
            energy-body model, and enables cross-platform presence through a unified protocol stack.
          </p>
        </section>

        {/* --- 四大层级卡片 (Layers) --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {layers.map((layer) => (
            <div key={layer.id} className="group relative p-8 border border-white/10 bg-white/[0.02] hover:bg-cyan-500/[0.03] hover:border-cyan-500/30 transition-all duration-500">
              <span className="absolute top-4 right-6 text-[10px] text-white/10 font-bold group-hover:text-cyan-500/40">
                {layer.id}
              </span>
              <h3 className="text-cyan-400 text-[11px] tracking-[0.4em] mb-6 font-bold uppercase">
                {layer.title}
              </h3>
              <p className="text-white/40 text-[9px] tracking-[0.2em] leading-relaxed uppercase">
                {layer.desc}
              </p>
            </div>
          ))}
        </section>

        {/* --- 底部声明 (Declaration) --- */}
        <section className="border-l border-cyan-500/50 pl-8 py-4">
          <p className="text-white/80 text-[10px] tracking-[0.3em] uppercase mb-2">
            MYSHAPE IS NOT AN ACCOUNT SYSTEM OR BIOMETRIC TOOL.
          </p>
          <p className="text-cyan-400/60 text-[9px] tracking-[0.2em] uppercase">
            IT IS A CIVILIZATIONAL IDENTITY PROTOCOL DESIGNED FOR AI-NATIVE EXISTENCE.
          </p>
        </section>
      </div>
    </ProtocolLayout>
  );
}