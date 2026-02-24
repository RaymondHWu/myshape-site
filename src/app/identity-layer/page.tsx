"use client";
import React from 'react';
import ProtocolLayout from "@/components/layout/ProtocolLayout";

export default function IdentityLayerPage() {
  const models = [
    { 
      name: "HALO", 
      desc: "The spiritual radiance of identity data.", 
      status: "COMPUTING", 
      detail: "Visualizing the foundational frequency of the sovereign body."
    },
    { 
      name: "PARTICLE", 
      desc: "The discrete data points of motion capture.", 
      status: "STABLE", 
      detail: "Granular movement vectors translated into verifiable identity atoms."
    },
    { 
      name: "SCANLINE", 
      desc: "The temporal record of existence.", 
      status: "ACTIVE", 
      detail: "Continuous verification stream across the time-identity axis."
    },
    { 
      name: "FIELD", 
      desc: "The interactive zone of the energy-body.", 
      status: "EXPANDING", 
      detail: "The influence radius of a data-body within the digital civilization."
    }
  ];

  return (
    <ProtocolLayout 
      refId="002" 
      category="PROTOCOL_CORE" 
      title="IDENTITY_LAYER" 
      secLevel="CLASS_A" 
      systemStatus="ACTIVE_NODE"
    >
      <div className="space-y-32">
        {/* --- 1. 核心定义：身份即几何 --- */}
        <section className="max-w-3xl">
          <h2 className="text-white/30 text-[10px] tracking-[0.6em] uppercase mb-8 flex items-center gap-4">
            <span className="w-8 h-[1px] bg-cyan-500/50" />
            Core_Concept
          </h2>
          <p className="text-xl md:text-2xl font-light tracking-widest text-white leading-relaxed">
            In the MyShape ecosystem, identity is not a string of characters, but a <span className="text-cyan-400">dynamic geometric expression</span>.
          </p>
          <p className="mt-8 text-white/50 text-sm tracking-widest leading-loose font-light">
            Through the Energy-Body Model, we translate raw motion data into a multi-dimensional 
            visual and cryptographic state. This is the first step toward becoming a sovereign data-body.
          </p>
        </section>

        {/* --- 2. 四大身份模型 (The Four Models) --- */}
        <section>
          <h3 className="text-white/20 text-[9px] tracking-[0.5em] uppercase mb-12 text-center">// IDENTITY_MODELS_CLASSIFICATION</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5 border border-white/5">
            {models.map((model) => (
              <div key={model.name} className="bg-[#02040a] p-10 group hover:bg-cyan-500/[0.02] transition-all duration-700">
                <div className="flex justify-between items-start mb-8">
                  <h4 className="text-xl tracking-[0.4em] font-extralight text-white group-hover:text-cyan-400 transition-colors">
                    {model.name}
                  </h4>
                  <span className="text-[8px] px-2 py-0.5 border border-cyan-500/30 text-cyan-500/60 font-bold uppercase tracking-tighter shadow-[0_0_5px_rgba(34,211,238,0.1)]">
                    {model.status}
                  </span>
                </div>
                <p className="text-white/70 text-[11px] tracking-[0.2em] uppercase mb-4 italic font-light">
                  {model.desc}
                </p>
                <div className="h-[1px] w-0 bg-cyan-500/30 group-hover:w-full transition-all duration-700 mb-6" />
                <p className="text-white/30 text-[10px] tracking-widest leading-relaxed uppercase">
                  {model.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* --- 3. 底部架构声明 --- */}
        <section className="relative p-12 border border-dashed border-white/10 text-center group">
          <div className="absolute inset-0 bg-cyan-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-white/40 text-[9px] tracking-[0.8em] uppercase mb-6">Identity_Architecture_Finality</p>
          <p className="text-sm md:text-base text-white font-light tracking-[0.3em] uppercase leading-loose">
            IDENTITY IS GEOMETRY. GEOMETRY IS DATA. <br/>
            DATA IS <span className="text-cyan-400">SOVEREIGNTY</span>.
          </p>
        </section>
      </div>
    </ProtocolLayout>
  );
}