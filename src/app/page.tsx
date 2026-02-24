"use client";

import React, { useState, useEffect } from "react"; 
import ProtocolHeader from "@/components/header/header"; 
import ProtocolFooter from "@/components/footer/footer";
import Hero from "@/components/hero/Hero";
import Vision from "@/components/vision/Vision";
import Capabilities from "@/components/capabilities/Capabilities";
import HowItWorks from "@/components/howitworks/HowItWorks";
import JoinWaitlist from "@/components/joinwaitlist/JoinWaitlist";

export default function HomePage() {
  const [userEmail, setUserEmail] = useState("");
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const [clientHash, setClientHash] = useState("0X7B2E1A9C");
  const [connected, setConnected] = useState(false);

  // 加密脱敏逻辑：RODDOG03 -> RO****03
  const maskIdentifier = (id: string) => {
    if (!id) return "RO****03";
    const name = id.split('@')[0];
    if (name.length <= 4) return name.toUpperCase();
    return `${name.substring(0, 2)}****${name.slice(-2)}`.toUpperCase();
  };

  // 1. 打字机动态 (监听 userEmail 变化)
  useEffect(() => {
    let i = 0;
    const rawID = userEmail ? userEmail.split('@')[0] : "roddog03";
    const maskedID = maskIdentifier(rawID);
    
    setDisplayText("");
    setIsTyping(true);
    
    const timer = setInterval(() => {
      setDisplayText(maskedID.slice(0, i));
      i++;
      if (i > maskedID.length) {
        setIsTyping(false);
        clearInterval(timer);
      }
    }, 150);
    return () => clearInterval(timer);
  }, [userEmail]);

  // 2. 数据流动态
  useEffect(() => {
    const generateHash = () => {
      setClientHash(`0X${Math.random().toString(16).substring(2, 10).toUpperCase()}`);
    };
    const hashInterval = setInterval(generateHash, 3000); 
    return () => clearInterval(hashInterval);
  }, []);

  return (
    <>
      <ProtocolHeader />
      
      {/* 全局 UI 层：确保钱包在最前面 */}
      <div className="fixed inset-0 z-[999] pointer-events-none">
        {/* 右上角：流光钱包 */}
        <div className="absolute top-10 right-10 pointer-events-auto">
          <button 
            onClick={() => setConnected(!connected)}
            className="flex items-center group cursor-pointer"
          >
            <div className="relative w-[1px] h-4 bg-white/20 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-cyan-400 animate-beam shadow-[0_0_5px_cyan]" />
            </div>
            <div className="px-4 flex items-center gap-2">
              <div className={`w-1 h-1 rounded-full ${connected ? "bg-cyan-400 shadow-[0_0_8px_cyan]" : "bg-white/40 animate-pulse"}`} />
              <span className="font-mono text-[9px] tracking-[0.3em] text-white/60 group-hover:text-cyan-200 transition-colors uppercase">
                {connected ? "MYSHAE.BASE.ETH" : "INITIATE_SYNC"}
              </span>
            </div>
            <div className="relative w-[1px] h-4 bg-white/20 overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-cyan-400 animate-beam [animation-delay:0.5s] shadow-[0_0_5px_cyan]" />
            </div>
          </button>
        </div>

        {/* 右下角：监控面板 (统一加密显示) */}
        <div className="absolute bottom-10 right-10 text-right">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[7px] tracking-[0.3em] text-cyan-500/50 uppercase font-light">
                PROTOCOL_CORE // ACTIVE
              </span>
              <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_cyan]" />
            </div>

            <div className="text-[12px] font-extralight text-white/90 tracking-[0.4em] uppercase leading-none mb-2 font-mono">
              {displayText}
              {isTyping && <span className="inline-block w-1.5 h-3 bg-cyan-400 ml-1 animate-pulse" />}
            </div>

            <div className="pr-3 border-r border-cyan-500/30 text-[7px] text-cyan-400/40 space-y-1 tracking-[0.1em] font-mono">
              <p className="animate-pulse">HASH: {clientHash}</p>
              <p>STATUS: GENESIS_SYNC</p>
            </div>
          </div>
        </div>
      </div>

      <main className="relative z-0 w-full overflow-x-hidden bg-black">
        <Hero />
        <Vision />
        <Capabilities />
        <HowItWorks />
        {/* 传入回调以同步邮箱 */}
        <JoinWaitlist onEmailChange={setUserEmail} />
      </main>

      <ProtocolFooter />

      <style jsx global>{`
        @keyframes beam { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        .animate-beam { animation: beam 2s linear infinite; }
      `}</style>
    </>
  );
}