"use client";
import React from "react";
import { playTick } from "@/utils/useAudioTick";

const STEPS = [
  { num: "01", label: "CAMERA", desc: "Real-time 30fps pose capture via MediaPipe. All processing on-device.", icon: "●" },
  { num: "02", label: "SST_18PT", desc: "33-point → 18-point Skeleton Topology. Bones, joints, angles.", icon: "◈" },
  { num: "03", label: "PES_4D", desc: "4-dimensional Entropy Scoring: timing, noise, frequency, biological.", icon: "◆" },
  { num: "04", label: "128D_VECTOR", desc: "Kinematics + Acceleration + Jerk + Jerk Spectrum → Motion Signature.", icon: "◇" },
  { num: "05", label: "ZK_PROOF", desc: "PoP + MP + EP composite proof. Verifiable without revealing data.", icon: "⬡" },
];

export default function ZKFlow() {
  return (
    <div className="relative py-8">
      {/* 流程图 */}
      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-0 md:gap-0">
        {/* 连接线 */}
        <div className="hidden md:block absolute top-1/2 left-[8%] right-[8%] h-[1px] bg-gradient-to-r from-cyan-400/10 via-cyan-400/30 to-cyan-400/10"
          style={{ transform: "translateY(-50%)" }} />

        {STEPS.map((step, i) => (
          <div
            key={step.num}
            onMouseEnter={() => playTick(500 + i * 100, "sine", 0.06, 0.015)}
            className="relative flex flex-row md:flex-col items-center gap-4 md:gap-3 py-3 md:py-0 md:w-[18%] group transition-all duration-500"
          >
            {/* 节点圆 */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border flex items-center justify-center transition-all duration-500 group-hover:scale-110"
                style={{
                  borderColor: i === 4 ? "rgba(34,211,238,0.5)" : "rgba(34,211,238,0.2)",
                  background: i === 4 ? "rgba(34,211,238,0.08)" : "transparent",
                  boxShadow: i === 4 ? "0 0 20px rgba(34,211,238,0.2)" : "none",
                }}>
                <span className="text-cyan-400/40 group-hover:text-cyan-300/70 text-[10px] font-mono transition-colors">
                  {step.icon}
                </span>
              </div>
              {/* 脉冲环 */}
              <div className="absolute inset-0 rounded-full border border-cyan-400/10 animate-ping opacity-0 group-hover:opacity-100 pointer-events-none"
                style={{ animationDuration: "3s" }} />
            </div>

            {/* 文字 */}
            <div className="flex-1 text-center md:text-center">
              <div className="text-cyan-400/30 text-[8px] tracking-[0.3em] mb-1 font-mono">{step.num}</div>
              <div className="text-white/50 text-[10px] tracking-[0.2em] uppercase mb-1 group-hover:text-white/80 transition-colors">
                {step.label}
              </div>
              <div className="hidden md:block text-white/15 text-[8px] leading-relaxed max-w-[140px] mx-auto group-hover:text-white/25 transition-colors">
                {step.desc}
              </div>
            </div>

            {/* 移动端连接线 */}
            {i < STEPS.length - 1 && (
              <div className="md:hidden absolute left-5 top-full w-[1px] h-4 bg-gradient-to-b from-cyan-400/20 to-transparent" />
            )}
          </div>
        ))}
      </div>

      {/* 底部标注 */}
      <div className="text-center mt-10 md:mt-8">
        <span className="text-cyan-400/15 text-[8px] tracking-[0.3em] uppercase">
          From Geometry → Proof in 5 steps. Zero raw data leaves the device.
        </span>
      </div>
    </div>
  );
}
