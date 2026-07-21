"use client";
import React from 'react';
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import IdentitySigil from "@/components/identity/IdentitySigil";
import "./ProtocolLayout.css";

interface ProtocolLayoutProps {
  children: React.ReactNode;
  refId: string;
  category: string;
  title: string;
  secLevel: string;
  systemStatus: string;
  renderSigil?: boolean;
  transparentBg?: boolean;
}

export default function ProtocolLayout({ 
  children, 
  refId, 
  category, 
  title, 
  secLevel, 
  systemStatus,
  renderSigil = false,
  transparentBg = false,
}: ProtocolLayoutProps) {
  return (
    <div className={`min-h-screen text-white font-mono selection:bg-[#90c8ff]/30 overflow-x-clip flex flex-col ${transparentBg ? 'bg-transparent' : 'bg-[#02040a]'}`}>
      {/* 1. 桌面端：背景動畫裝飾 */}
      <div className="hidden md:block fixed inset-0 pointer-events-none opacity-10"
           style={{
             backgroundImage: 'radial-gradient(circle, #90c8ff 1px, transparent 1px)',
             backgroundSize: '60px 60px'
           }} />

      <div className="hidden md:block fixed top-0 left-0 w-full h-[2px] bg-[#90c8ff]/5 shadow-[0_0_15px_rgba(144,200,255,0.2)] animate-scan-slow pointer-events-none z-50" />

      <ProtocolHeader />

      {/* 2. 頁面內容主體 */}
      <main className="flex flex-col flex-1 pt-24 md:pt-40 pb-4 md:pb-10 px-4 md:px-10 max-w-5xl mx-auto relative z-10 animate-fade-in w-full protocol-main">
        {/* 页面标题区 */}
        <div className="relative mb-8 md:mb-24 border-b border-white/10 pb-6 md:pb-12">
          <div className="flex justify-between items-end">
            <div>
              {renderSigil ? (
                <IdentitySigil />
              ) : (
                <div className="text-[#90c8ff]/60 text-[11px] tracking-[0.4em] mb-4 uppercase">
                  {category} // REF_{refId}
                </div>
              )}
              <h1 className="text-3xl md:text-4xl font-light tracking-[0.15em] text-white uppercase">
                {title.replace(/_/g, ' ')}
              </h1>
            </div>
            <div className="text-[11px] tracking-[0.2em] text-right uppercase leading-loose font-mono">
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                STATUS: {secLevel}
              </span>
              <br/>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                PHASE: {systemStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col min-h-0 md:min-h-[30vh] protocol-main-inner" style={{ flex: 1 }}>
          {children}
        </div>
      </main>

      {/* 3. 全局唯一 Footer */}
      <ProtocolFooter />

    </div>
  );
}