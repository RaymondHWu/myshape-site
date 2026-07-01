"use client";
import React from 'react';
import Link from 'next/link';
import ProtocolLayout from "@/components/layout/ProtocolLayout";

export default function CivPublication() {
  const mediaChannels = [
    { id: "LOG_01", title: "Technical Announcements", desc: "DIRECT STREAM OF CORE PROTOCOL UPDATES, ARCHITECTURAL SHIFTS.", meta: "UPLINK: ACTIVE", href: "https://x.com/myshapeprotocol" },
    { id: "LOG_02", title: "Media & Press Kit", desc: "OFFICIAL ASSETS, BRAND GUIDELINES, AND VISUALIZATIONS.", meta: "ACCESS: PUBLIC", href: "mailto:hello@myshape.com" },
    { id: "LOG_03", title: "Community Intelligence", desc: "INSIGHTS FROM THE DECENTRALIZED IDENTITY ECOSYSTEM.", meta: "SIGNAL: STABLE", href: "https://github.com/myshapeprotocol" },
    { id: "LOG_04", title: "Civilizational Reports", desc: "LONG-FORM EXPLORATIONS INTO SOCIOLOGICAL IMPACT.", meta: "REF: CLASS_B", href: "/civ-layer/papers" }
  ];

  return (
    <ProtocolLayout 
      refId="008" 
      category="CIV_LAYER" 
      title="PUBLICATION" 
      secLevel="CLASS_B" 
      systemStatus="INDEXED_LOG"
    >
      <div className="space-y-32 pb-32">
        {/* --- SECTION 1: 核心引言 --- */}
        <section className="max-w-4xl">
          <h2 className="text-[#90c8ff]/80 text-[10px] tracking-[0.6em] font-bold uppercase mb-8">// BROADCAST_MATRIX</h2>
          <p className="text-xl md:text-3xl font-extralight tracking-widest text-white leading-tight uppercase">
            MyShape is more than a protocol; it is a <span className="text-[#90c8ff]">new narrative</span> for human existence.
          </p>
        </section>

        {/* --- SECTION 2: 深度存檔 (MANIFESTO 入口) --- */}
        <section className="relative group">
          <div className="absolute -inset-[1px] bg-[#90c8ff]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="relative border border-white/10 bg-white/[0.02] p-12 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-[#90c8ff] font-mono text-xs font-bold uppercase tracking-[0.3em]">Protocol_Doctrine</span>
                <span className="text-white/20 text-[10px]">VER_2026.01</span>
              </div>
              <h3 className="text-3xl font-light tracking-[0.4em] text-white">THE MANIFESTO</h3>
              <p className="text-white/40 text-xs tracking-[0.2em] leading-relaxed max-w-xl uppercase">
                "We begin from a simple truth: a human is not a dataset." 
                The foundational declaration of digital sovereignty.
              </p>
            </div>
            
            {/* 這是跳轉到新頁面的「沉浸式入口」 */}
            <Link href="/civ-layer/publication/manifesto" className="shrink-0 group/link">
              <div className="px-10 py-5 border border-[#90c8ff]/40 text-[#90c8ff] text-[10px] tracking-[0.5em] font-bold group-hover/link:bg-[#90c8ff] group-hover/link:text-black transition-all uppercase">
                Decode_Manifesto →
              </div>
            </Link>
          </div>
        </section>

        {/* --- SECTION 3: 媒體矩陣列表 (保留你之前的所有細節) --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10">
          {mediaChannels.map((channel) => (
            <a key={channel.id} href={channel.href} target={channel.href.startsWith("http") ? "_blank" : undefined} rel={channel.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="bg-[#02040a] p-12 group hover:bg-[#90c8ff]/[0.04] transition-all duration-500 relative overflow-hidden block">
              <div className="flex justify-between items-start mb-12">
                <span className="text-[#90c8ff]/40 text-[9px] tracking-[0.4em] font-mono group-hover:text-[#90c8ff]">{channel.id}</span>
                <span className="text-white/10 text-[8px] tracking-[0.2em]">{channel.meta}</span>
              </div>
              <h3 className="text-white text-lg tracking-[0.3em] font-light uppercase mb-6 group-hover:text-[#90c8ff]">{channel.title}</h3>
              <p className="text-white/30 text-[10px] tracking-[0.2em] leading-relaxed uppercase">{channel.desc}</p>
              <div className="absolute -bottom-2 -right-2 text-[40px] font-bold text-white/[0.02] pointer-events-none select-none">
                {channel.id.split('_')[1]}
              </div>
            </a>
          ))}
        </section>

        {/* --- SECTION 4: 底部官方媒體聲明 --- */}
        <section className="border border-white/5 bg-white/[0.01] p-12">
          <div className="flex flex-col md:flex-row gap-12 items-center justify-between">
            <div className="space-y-4">
              <p className="text-white/80 text-xs tracking-[0.3em] uppercase font-bold">Official_Press_Inquiries:</p>
              <p className="text-white/40 text-[10px] tracking-[0.2em] uppercase max-w-xl">
                For media collaboration or interview requests, please utilize the encrypted gateway.
              </p>
            </div>
            <a href="mailto:hello@myshape.com" className="text-[#90c8ff] text-[11px] tracking-[0.4em] font-bold border-b border-[#90c8ff]/30 hover:border-[#90c8ff] transition-all pb-1 uppercase">
              HELLO@MYSHAPE.COM
            </a>
          </div>
        </section>
      </div>
    </ProtocolLayout>
  );
}