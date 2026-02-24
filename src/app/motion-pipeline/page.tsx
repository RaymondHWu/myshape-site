"use client";
import React from 'react';
import ProtocolLayout from "@/components/layout/ProtocolLayout";

export default function MotionPipelinePage() {
  const pipelineSteps = [
    { 
      step: "01", 
      title: "CAPTURE", 
      label: "LOCAL_DEVICE", 
      desc: "Raw kinetic energy captured via local visual sensors. No cloud streaming." 
    },
    { 
      step: "02", 
      title: "EXTRACT", 
      label: "GEOMETRY_ENGINE", 
      desc: "Anonymizing skeletal data into pure motion geometry vectors." 
    },
    { 
      step: "03", 
      title: "ENCRYPT", 
      label: "ZK_PROOF_GEN", 
      desc: "Generating Zero-Knowledge proofs of movement without revealing the source." 
    },
    { 
      step: "04", 
      title: "MINT", 
      label: "IDENTITY_NODE", 
      desc: "Projecting the motion-body into the cross-platform protocol layer." 
    }
  ];

  return (
    <ProtocolLayout 
      refId="003" 
      category="PROTOCOL_CORE" 
      title="MOTION_PIPELINE" 
      secLevel="CLASS_A" 
      systemStatus="DATA_FLOWING"
    >
      <div className="space-y-32">
        {/* --- 1. 核心流程简述 --- */}
        <section className="max-w-3xl">
          <h2 className="text-white/30 text-[10px] tracking-[0.6em] uppercase mb-8 flex items-center gap-4">
            <span className="w-8 h-[1px] bg-cyan-500/50" />
            Processing_Architecture
          </h2>
          <p className="text-xl md:text-2xl font-light tracking-widest text-white leading-relaxed">
            The Motion-to-ZK pipeline is the <span className="text-cyan-400">computational spine</span> of the MyShape Protocol.
          </p>
          <p className="mt-8 text-white/50 text-sm tracking-widest leading-loose font-light">
            It ensures that biological motion is never stored or surveilled, but instead distilled into a 
            verifiable mathematical signature. Private by design, sovereign by execution.
          </p>
        </section>

        {/* --- 2. 流水线步骤 (The Pipeline Steps) --- */}
        <section className="relative">
          {/* 装饰性连接线 (仅在桌面端显示) */}
          <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent -translate-y-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
            {pipelineSteps.map((item) => (
              <div key={item.step} className="group flex flex-col items-center text-center">
                {/* 步骤圆环 */}
                <div className="w-16 h-16 rounded-full border border-white/10 bg-[#02040a] flex items-center justify-center mb-8 group-hover:border-cyan-500 transition-all duration-500 relative">
                  <span className="text-[10px] text-white/20 group-hover:text-cyan-400 font-bold tracking-tighter transition-colors">
                    {item.step}
                  </span>
                  {/* 外圈旋转动画（仅 Hover） */}
                  <div className="absolute inset-[-4px] border border-cyan-500/0 border-t-cyan-500/40 rounded-full opacity-0 group-hover:opacity-100 group-hover:rotate-180 transition-all duration-1000" />
                </div>

                <div className="space-y-4">
                  <h4 className="text-white text-[12px] tracking-[0.4em] font-bold uppercase group-hover:text-cyan-400 transition-colors">
                    {item.title}
                  </h4>
                  <div className="text-cyan-500/40 text-[8px] tracking-[0.2em] font-mono">
                    [{item.label}]
                  </div>
                  <p className="text-white/30 text-[9px] tracking-[0.15em] leading-relaxed uppercase max-w-[200px] mx-auto">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- 3. SDK 技术声明 --- */}
        <section className="bg-white/[0.01] border border-white/5 p-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="space-y-4">
              <h3 className="text-white/80 text-[11px] tracking-[0.4em] uppercase font-bold">SDK_Integration_Layer</h3>
              <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase leading-relaxed max-w-md">
                A high-performance SDK enabling developers to plug biological motion into any 3D engine while maintaining Zero-Knowledge integrity.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2 text-right">
              <span className="text-cyan-500/60 text-[9px] tracking-[0.3em] font-bold">STATUS: STABLE_BUILD_V0.8</span>
              <span className="text-white/20 text-[8px] tracking-[0.1em]">COMPATIBILITY: UNREAL / UNITY / WEBGL</span>
            </div>
          </div>
        </section>
      </div>
    </ProtocolLayout>
  );
}