"use client";
import React, { useState, useEffect } from "react";
import HeroVisual from "./HeroVisual";
import GlowVortexButton from "./GlowVortexButton";
import NarrativeText from "./NarrativeText";

export default function Hero() {
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  useEffect(() => {
    const closeAll = () => { setShowLeft(false); setShowRight(false); };
    window.addEventListener("click", closeAll);
    return () => window.removeEventListener("click", closeAll);
  }, []);

  const leftLines = ["THE BODY IS A SIGNAL.", "THE SELF IS A FIELD.", "GEOMETRY HOLDS MEMORY.", "FORM CARRIES INTENT.", "SOVEREIGNTY BEGINS HERE."];
  const rightLines = ["YOU ARE A SHAPE.", "A PATTERN IN MOTION.", "A FIELD OF MEMORY.", "A VECTOR OF INTENT.", "MYSHAPE MAKES IT YOURS."];

  return (
    <>
      {/* 🚀 影子星空：强制设为 zIndex -1，确保它在所有模块的最底层，绝不遮挡文字 */}
      <div 
        style={{ 
          position: 'fixed', 
          inset: 0, 
          zIndex: -1, 
          pointerEvents: 'none', 
          backgroundColor: '#02040a' 
        }}
      >
        <HeroVisual showCore={false} />
      </div>

      {/* 🚀 首页 Hero 容器：强制背景透明，透出底层的固定星空 */}
      <section 
        style={{ 
          position: 'relative', 
          width: '100%', 
          height: '100vh', 
          overflow: 'hidden', 
          backgroundColor: 'transparent' 
        }}
      >
        {/* 首页粒子核心：随 Hero 模块一起滚动 */}
        <HeroVisual showCore={true} />

        {/* 严格还原：文案位置与字号 */}
        <div className="absolute top-[14vh] left-0 w-full z-[5000] pointer-events-none text-center px-6">
          <h1 
            className="text-[1.4rem] md:text-[1.8rem] font-extralight uppercase text-white/90"
            style={{ letterSpacing: '0.8em', textIndent: '0.8em' }}
          >
            THE SOVEREIGN IDENTITY LAYER
          </h1>
          <p className="mt-5 text-[10px] md:text-[11px] tracking-[0.4em] text-blue-300/40 uppercase font-mono">
            The Decentralized 3D Identity Standard
          </p>
        </div>

        {/* 严格还原：按钮容器 */}
        <div className="absolute inset-0 flex items-center justify-between px-[8vw] z-[9999] pointer-events-none">
          <div className="pointer-events-auto">
            <GlowVortexButton onClick={(e) => { e.stopPropagation(); setShowRight(false); setShowLeft(!showLeft); }} />
          </div>
          <div className="pointer-events-auto">
            <GlowVortexButton onClick={(e) => { e.stopPropagation(); setShowLeft(false); setShowRight(!showRight); }} />
          </div>
        </div>

        {/* 叙事文本 */}
        <NarrativeText lines={leftLines} visible={showLeft} side="left" />
        <NarrativeText lines={rightLines} visible={showRight} side="right" />
      </section>
    </>
  );
}