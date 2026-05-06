"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import GlowVortexButton from "./GlowVortexButton";
import NarrativeText from "./NarrativeText";

export default function Hero() {
  const router = useRouter();
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const closeAll = () => {
      setShowLeft(false);
      setShowRight(false);
    };
    window.addEventListener("click", closeAll);
    return () => window.removeEventListener("click", closeAll);
  }, []);

  const handleEnterGenesis = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent("protocol:genesis-ignite"));
    // 3s supernova animation, then 800ms fade buffer
    setTimeout(() => {
      setIsFading(true);
    }, 3000);
    setTimeout(() => {
      router.push("/protocol");
    }, 3800);
  };

  const handleProtocolInitialize = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent("protocol:rapid-pulse"));
    window.dispatchEvent(new CustomEvent("protocol:open-wallet"));
  };

  const leftLines = [
    "THE BODY IS A SIGNAL.",
    "THE SELF IS A FIELD.",
    "GEOMETRY HOLDS MEMORY.",
    "FORM CARRIES INTENT.",
    "SOVEREIGNTY BEGINS HERE.",
  ];
  const rightLines = [
    "YOU ARE A SHAPE.",
    "A PATTERN IN MOTION.",
    "A FIELD OF MEMORY.",
    "A VECTOR OF INTENT.",
    "MYSHAPE MAKES IT YOURS.",
  ];

  return (
    <>
      {/* 🚀 修正：删除了内部的所有 HeroVisual。
          视觉层现在由 layout.tsx 里的单例统一管理，避免多重渲染卡顿。 */}
      
      <section
        style={{
          position: "relative",
          width: "100%",
          height: "100vh",
          overflow: "hidden",
          backgroundColor: "transparent", // 必须透明，透出底层的全站星空
        }}
      >
        {/* Fade container — overlays fade out during genesis exit */}
        <div className={`hero-overlay ${isFading ? 'hero-fade-out' : ''}`}>
          
          {/* 文案位置与字号 */}
          <div className="absolute top-[14vh] left-0 w-full z-10 pointer-events-none text-center px-6">
            <h1
              className="text-[1.4rem] md:text-[1.8rem] font-extralight uppercase text-white/90"
              style={{ letterSpacing: "0.8em", textIndent: "0.8em" }}
            >
              THE SOVEREIGN IDENTITY LAYER
            </h1>
            <p className="mt-5 text-[8px] md:text-[9px] tracking-[0.3em] text-blue-300/25 uppercase font-mono max-w-2xl mx-auto leading-relaxed">
              The decentralized motion-native protocol for verifiable human-AI existence.
            </p>
          </div>

          {/* 按钮容器 - 调整了 z-index 确保可点击 */}
          <div className="absolute inset-0 flex items-center justify-between px-[8vw] z-[50] pointer-events-none">
            <div className="pointer-events-auto">
              <GlowVortexButton
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRight(false);
                  setShowLeft(!showLeft);
                }}
              />
            </div>
            <div className="pointer-events-auto">
              <GlowVortexButton
                onClick={(e) => {
                  e.stopPropagation();
                  setShowLeft(false);
                  setShowRight(!showRight);
                }}
              />
            </div>
          </div>

          {/* 叙事文本 */}
          <NarrativeText lines={leftLines} visible={showLeft} side="left" />
          <NarrativeText lines={rightLines} visible={showRight} side="right" />

          {/* 主入口 CTA：位于粒子云下方（基于 fixed 视口定位） */}
          <div className="absolute top-[75vh] left-0 w-full z-20 text-center">
            <button
              onClick={handleEnterGenesis}
              className="enter-genesis group relative inline-block px-12 py-4 bg-transparent"
            >
              <span className="relative z-10 font-mono font-extralight text-[12px] tracking-[0.6em] text-white/90 group-hover:text-cyan-400 transition-all duration-700">
                [ ENTER _ GENESIS ]
              </span>
              <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(144,200,255,0.12) 0%, transparent 70%)', filter: 'blur(12px)' }} />
              <div className="flow-boundary absolute -bottom-3 left-[5%] right-[5%] h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                <div className="flow-dot left-0" />
                <div className="flow-dot left-[15%]" />
                <div className="flow-dot left-[30%]" />
                <div className="flow-glow" />
                <div className="flow-dot right-[30%]" />
                <div className="flow-dot right-[15%]" />
                <div className="flow-dot right-0" />
              </div>
            </button>
          </div>

          {/* 底层协议命令 */}
          <div className="absolute bottom-[60px] left-0 w-full z-20 text-center">
            <button
              onClick={handleProtocolInitialize}
              className="protocol-access inline-block bg-transparent"
            >
              <span className="font-mono font-extralight text-[7px] md:text-[8px] tracking-[0.5em] text-white/15 hover:text-cyan-400 transition-all duration-500">
                [ PROTOCOL _ GENESIS _ INITIALIZE ]
              </span>
            </button>
          </div>
        </div>
      </section>

      <style>{`
        .hero-overlay {
          transition: opacity 0.8s ease;
        }
        .hero-overlay.hero-fade-out {
          opacity: 0;
        }
        .flow-boundary {
          background: radial-gradient(ellipse at center, rgba(144, 200, 255, 0.06) 0%, transparent 70%);
        }
        .flow-dot {
          position: absolute;
          top: 50%;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: rgba(144, 200, 255, 0.35);
          transform: translateY(-50%);
          filter: blur(1px);
          opacity: 0;
        }
        .flow-glow {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 6px;
          height: 2px;
          border-radius: 50%;
          background: rgba(144, 200, 255, 0.15);
          transform: translate(-50%, -50%);
          filter: blur(3px);
          opacity: 0;
        }
        .enter-genesis:hover .flow-dot {
          animation: flowCenter 0.9s cubic-bezier(0.2, 1, 0.3, 1) forwards;
        }
        .enter-genesis:hover .flow-glow {
          opacity: 1;
          animation: glowPulse 1.5s ease-in-out infinite;
        }
        .enter-genesis:hover .flow-dot:nth-child(1) { animation-delay: 0s; }
        .enter-genesis:hover .flow-dot:nth-child(2) { animation-delay: 0.15s; }
        .enter-genesis:hover .flow-dot:nth-child(3) { animation-delay: 0.3s; }
        .enter-genesis:hover .flow-dot:nth-child(5) { animation-delay: 0.15s; }
        .enter-genesis:hover .flow-dot:nth-child(6) { animation-delay: 0.3s; }
        .enter-genesis:hover .flow-dot:nth-child(7) { animation-delay: 0s; }
        @keyframes flowCenter {
          0% { opacity: 0; transform: translateY(-50%) translateX(var(--tx-start, -10px)) scale(0.5); }
          30% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-50%) translateX(0) scale(1.2); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.3); }
        }
        .flow-dot:nth-child(1) { --tx-start: -18px; }
        .flow-dot:nth-child(2) { --tx-start: -12px; }
        .flow-dot:nth-child(3) { --tx-start: -6px; }
        .flow-dot:nth-child(5) { --tx-start: 6px; }
        .flow-dot:nth-child(6) { --tx-start: 12px; }
        .flow-dot:nth-child(7) { --tx-start: 18px; }
      `}</style>
    </>
  );
}