"use client";
import React from 'react';
import ProtocolLayout from "@/components/layout/ProtocolLayout";

export default function PublicationPage() {
  // 找回所有被删减的媒体渠道细节
  const mediaChannels = [
    {
      id: "LOG_01",
      title: "Technical Announcements",
      desc: "DIRECT STREAM OF CORE PROTOCOL UPDATES, ARCHITECTURAL SHIFTS, AND SECURITY AUDIT RELEASES.",
      meta: "UPLINK: ACTIVE"
    },
    {
      id: "LOG_02",
      title: "Media & Press Kit",
      desc: "OFFICIAL ASSETS, BRAND GUIDELINES, AND HIGH-RESOLUTION VISUALIZATIONS OF THE ENERGY-BODY MODEL.",
      meta: "ACCESS: PUBLIC"
    },
    {
      id: "LOG_03",
      title: "Community Intelligence",
      desc: "INSIGHTS FROM THE DECENTRALIZED IDENTITY ECOSYSTEM AND GLOBAL MOTION CAPTURE NETWORK.",
      meta: "SIGNAL: STABLE"
    },
    {
      id: "LOG_04",
      title: "Civilizational Reports",
      desc: "LONG-FORM EXPLORATIONS INTO THE SOCIOLOGICAL IMPACT OF AI-NATIVE SOVEREIGN IDENTITY.",
      meta: "REF: CLASS_B"
    }
  ];

  return (
    <ProtocolLayout 
      refId="008" 
      category="CIV_LAYER" 
      title="PUBLICATION" 
      secLevel="CLASS_B" 
      systemStatus="INDEXED_LOG"
    >
      <div className="space-y-32">
        {/* --- 1. 核心引言：完全找回之前的深刻描述 --- */}
        <section className="max-w-4xl">
          <h2 className="text-cyan-500/80 text-[10px] tracking-[0.6em] font-bold uppercase mb-8">// BROADCAST_MATRIX</h2>
          <p className="text-xl md:text-3xl font-extralight tracking-widest text-white leading-tight uppercase">
            MyShape is more than a protocol; it is a <span className="text-cyan-400">new narrative</span> for human existence in the digital age.
          </p>
          <p className="mt-8 text-white/50 text-sm tracking-[0.2em] leading-loose font-light">
            Our publications serve as the primary interface between the protocol's internal evolution and the external world. 
            From deep-tech breakthroughs to civilizational philosophy, all transmissions are indexed here for permanent record.
          </p>
        </section>

        {/* --- 2. 媒体矩阵列表 (完整的丰富内容) --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10">
          {mediaChannels.map((channel) => (
            <div key={channel.id} className="bg-[#02040a] p-12 group hover:bg-cyan-500/[0.04] transition-all duration-500 relative overflow-hidden">
              <div className="flex justify-between items-start mb-12">
                <span className="text-cyan-500/40 text-[9px] tracking-[0.4em] font-mono group-hover:text-cyan-400 transition-colors">
                  {channel.id}
                </span>
                <span className="text-white/10 text-[8px] tracking-[0.2em] group-hover:text-white/30 transition-colors">
                  {channel.meta}
                </span>
              </div>
              <h3 className="text-white text-lg tracking-[0.3em] font-light uppercase mb-6 group-hover:text-cyan-400 transition-colors">
                {channel.title}
              </h3>
              <p className="text-white/30 text-[10px] tracking-[0.2em] leading-relaxed uppercase">
                {channel.desc}
              </p>
              {/* 装饰性底层文字 */}
              <div className="absolute -bottom-2 -right-2 text-[40px] font-bold text-white/[0.02] pointer-events-none select-none">
                {channel.id.split('_')[1]}
              </div>
            </div>
          ))}
        </section>

        {/* --- 3. 找回之前的底部官方媒体声明 --- */}
        <section className="border border-white/5 bg-white/[0.01] p-12 relative">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-8 space-y-6">
              <p className="text-white/80 text-xs tracking-[0.3em] uppercase leading-relaxed font-bold">
                Official_Press_Inquiries:
              </p>
              <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase leading-relaxed">
                For media collaboration, high-resolution visual assets of the Halo/Particle models, 
                or interview requests with the core architecture team, please utilize the encrypted gateway.
              </p>
            </div>
            <div className="md:col-span-4 flex flex-col items-end gap-4">
               <a href="mailto:hello@myshape.com" className="text-cyan-400 text-[11px] tracking-[0.4em] font-bold border-b border-cyan-400/30 hover:border-cyan-400 transition-all pb-1">
                 HELLO@MYSHAPE.COM
               </a>
               <span className="text-white/20 text-[8px] tracking-[0.1em]">EST_RESPONSE_TIME: 24H_CYCLE</span>
            </div>
          </div>
        </section>
      </div>
    </ProtocolLayout>
  );
}