"use client";

import React, { useState, useEffect } from "react";
import HeroVisual from "./HeroVisual";
import GlowVortexButton from "./GlowVortexButton";
import NarrativeText from "./NarrativeText";

export default function Hero() {
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  /* 点击任意处关闭叙事 */
  useEffect(() => {
    const closeAll = () => {
      setShowLeft(false);
      setShowRight(false);
    };
    window.addEventListener("click", closeAll);
    return () => window.removeEventListener("click", closeAll);
  }, []);

  /* 文案出现时触发能量脉冲 */
  useEffect(() => {
    if (showLeft || showRight) {
      document.body.classList.add("vortex-pulse");
      setTimeout(() => {
        document.body.classList.remove("vortex-pulse");
      }, 300);
    }
  }, [showLeft, showRight]);

  /* 最终文案（B++） */
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
    <section className="relative w-full h-screen overflow-hidden bg-black">
      {/* 粒子视觉层 */}
      <HeroVisual showCore={true} />

      {/* 顶部标题 */}
      <div className="absolute top-0 left-0 w-full z-20 pointer-events-none text-center pt-[8vh] px-6">
        <h1 className="text-[1.8rem] md:text-[2.6rem] font-extralight tracking-[0.35em] uppercase text-white/90">
          MYSHAPE PROTOCOL
        </h1>

        <p className="mt-4 text-[12px] md:text-[14px] tracking-[0.25em] text-blue-300/60 uppercase">
          The Sovereign 3D Identity Layer for the Decentralized Human.
        </p>
      </div>

      {/* 左右按钮 */}
      <div className="absolute inset-0 flex items-center justify-between px-[8vw] z-30">
        <GlowVortexButton
          onClick={(e) => {
            e.stopPropagation();
            setShowRight(false);
            setShowLeft(!showLeft);
          }}
        />

        <GlowVortexButton
          onClick={(e) => {
            e.stopPropagation();
            setShowLeft(false);
            setShowRight(!showRight);
          }}
        />
      </div>

      {/* 左右叙事文本 */}
      <NarrativeText lines={leftLines} visible={showLeft} side="left" />
      <NarrativeText lines={rightLines} visible={showRight} side="right" />
    </section>
  );
}
