"use client";

import React from "react";

/* ──────────────────────────────────────────────
   HaloScan — 圆形深感光环扫描 (CSS)
   Positioned absolutely behind the wireframe anatomy,
   creates the "deep-sense" scanning ring effect.
   ────────────────────────────────────────────── */

interface Props {
  /** How many halo rings to render */
  rings?: number;
  /** 0–1 scan intensity */
  intensity: number;
}

const HaloScan: React.FC<Props> = ({ rings = 5, intensity }) => {
  return (
    <div
      className="absolute left-1/2 top-[55%] pointer-events-none"
      style={{
        width: 0,
        height: 0,
        opacity: 0.15 + intensity * 0.7,
        transition: "opacity 1.2s ease-out",
      }}
      aria-hidden="true"
    >
      <div style={{ transform: "scale(0.78)", transformOrigin: "center" }}>
      {/* 固定基准光环 — 脉冲呼吸 */}
      <div
        className="absolute rounded-full"
        style={{
          width: "320px",
          height: "320px",
          border: "1px solid rgba(144,200,255,0.45)",
          boxShadow:
            "0 0 40px rgba(144,200,255,0.12), inset 0 0 40px rgba(144,200,255,0.06)",
          animation: "haloPulse 3s ease-in-out infinite",
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(144,200,255,0.03) 0%, transparent 70%)",
        }}
      />

      {/* 内层轻光环 — 慢速反向旋转 */}
      <div
        className="absolute rounded-full"
        style={{
          width: "240px",
          height: "240px",
          border: "0.8px dashed rgba(160,210,255,0.35)",
          animation: "haloRotateReverse 25s linear infinite",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* 外层虚线环 — 慢速旋转 */}
      <div
        className="absolute rounded-full"
        style={{
          width: "400px",
          height: "400px",
          border: "0.6px dashed rgba(144,200,255,0.25)",
          animation: "haloRotate 35s linear infinite",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* 动态扩展光环 */}
      {Array.from({ length: rings }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: "280px",
            height: "280px",
            border: "1px solid rgba(144,200,255,0.4)",
            boxShadow: "0 0 25px rgba(144,200,255,0.08)",
            animation: `haloExpand 4s ease-out ${i * 0.8}s infinite`,
            transform: "translate(-50%, -50%)",
            opacity: 0,
          }}
        />
      ))}

      {/* 大型慢速光环 */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={`slow-${i}`}
          className="absolute rounded-full"
          style={{
            width: "360px",
            height: "360px",
            border: "0.5px solid rgba(144,200,255,0.3)",
            animation: `haloExpandSlow 6s ease-out ${i * 2}s infinite`,
            transform: "translate(-50%, -50%)",
            opacity: 0,
          }}
        />
      ))}

      {/* 中央感知核心 */}
      <div
        className="absolute rounded-full"
        style={{
          width: "8px",
          height: "8px",
          background: "radial-gradient(circle, #fff 0%, rgba(144,200,255,0.6) 60%, transparent 100%)",
          boxShadow: "0 0 20px rgba(144,200,255,0.7), 0 0 50px rgba(144,200,255,0.3)",
          animation: "haloPulse 1.5s ease-in-out infinite",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* ── Scene 3 同款：扩散光环 + 轨道亮点 ── */}
      {Array.from({ length: 4 }).map((_, r) => {
        const baseR = 80 + r * 100;
        return (
          <div
            key={`scan-ring-${r}`}
            className="absolute"
            style={{
              animation: `haloOrbitSpin ${3.5 + r * 0.6}s linear ${r * 0.7}s infinite`,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* 扩散光环 */}
            <div
              className="absolute rounded-full"
              style={{
                width: `${baseR * 2}px`,
                height: `${baseR * 2}px`,
                border: "1.2px solid rgba(144,200,255,0.7)",
                boxShadow: "0 0 8px rgba(144,200,255,0.25)",
                animation: `haloExpand 4s ease-out ${r * 0.5}s infinite`,
                transform: "translate(-50%, -50%)",
                opacity: 0,
              }}
            />
            {/* 轨道亮点 — 跟随容器旋转，沿圆周移动 */}
            <div
              className="absolute"
              style={{
                width: "7px",
                height: "7px",
                background: "radial-gradient(circle, rgba(240,248,255,1) 0%, rgba(180,220,255,0.6) 40%, rgba(144,200,255,0) 100%)",
                borderRadius: "50%",
                boxShadow: "0 0 6px rgba(200,230,255,0.7)",
                transform: `translate(-50%, -50%) translateX(${baseR}px)`,
              }}
            />
          </div>
        );
      })}
      </div>
    </div>
  );
};

export default HaloScan;
