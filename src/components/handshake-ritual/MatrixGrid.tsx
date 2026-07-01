"use client";

import React from "react";

/* ──────────────────────────────────────────────
   MatrixGrid — 全息矩阵控制台背景 (CSS)

   2D 网格线 + 交叉点发光系统。
   intensity 控制整体亮度和交叉点辉光。
   视觉上作为协议层的"基础设施"隐喻。
   ────────────────────────────────────────────── */

interface MatrixGridProps {
  /** 0→1 网格亮度 */
  intensity: number;
  /** 网格线颜色 */
  color?: string;
  /** 交叉点发光颜色 */
  glowColor?: string;
}

const MatrixGrid: React.FC<MatrixGridProps> = ({
  intensity,
  color = "rgba(144,200,255,0.15)",
  glowColor = "rgba(144,200,255,0.5)",
}) => {
  const gridOpacity = 0.06 + intensity * 0.35;
  const glowOpacity = intensity * 0.6;
  const bgRadial = intensity * 0.12;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* ── 径向光晕：核心区域微亮 ── */}
      <div
        className="absolute left-1/2"
        style={{
          top: "55%",
          width: "600px",
          height: "600px",
          transform: "translate(-50%, -50%)",
          background: `radial-gradient(circle, rgba(144,200,255,${bgRadial}) 0%, transparent 70%)`,
          transition: "background 1.5s ease-out",
        }}
      />

      {/* ── 水平网格线 ── */}
      <div
        className="absolute inset-0"
        style={{
          opacity: gridOpacity,
          transition: "opacity 1.2s ease-out",
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              ${color},
              ${color} 1px,
              transparent 1px,
              transparent 40px
            )
          `,
        }}
      />

      {/* ── 垂直网格线 ── */}
      <div
        className="absolute inset-0"
        style={{
          opacity: gridOpacity,
          transition: "opacity 1.2s ease-out",
          backgroundImage: `
            repeating-linear-gradient(
              90deg,
              ${color},
              ${color} 1px,
              transparent 1px,
              transparent 40px
            )
          `,
        }}
      />

      {/* ── 透视纵深线（从下半部中心向外辐射） ── */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          opacity: gridOpacity * 0.7,
          transition: "opacity 1.2s ease-out",
        }}
      >
        <defs>
          <radialGradient id="gridFade" cx="50%" cy="55%" r="45%">
            <stop offset="0%" stopColor={glowColor} stopOpacity="1" />
            <stop offset="60%" stopColor={glowColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={glowColor} stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* 从中心辐射的水平线 */}
        {Array.from({ length: 16 }).map((_, i) => {
          const y = 20 + i * 4.5;
          return (
            <line
              key={`h-${i}`}
              x1="5%"
              y1={`${y}%`}
              x2="95%"
              y2={`${y}%`}
              stroke="url(#gridFade)"
              strokeWidth="0.3"
            />
          );
        })}
        {/* 从中心辐射的垂直线 */}
        {Array.from({ length: 20 }).map((_, i) => {
          const x = 3 + i * 5;
          return (
            <line
              key={`v-${i}`}
              x1={`${x}%`}
              y1="0%"
              x2={`${x}%`}
              y2="100%"
              stroke="url(#gridFade)"
              strokeWidth="0.3"
            />
          );
        })}
      </svg>

      {/* ── 交叉点发光 ── */}
      <div
        className="absolute inset-0"
        style={{
          opacity: glowOpacity,
          transition: "opacity 1.2s ease-out",
          backgroundImage: `
            radial-gradient(circle, ${glowColor} 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
          backgroundPosition: "center 55%",
        }}
      />

      {/* ── 核心区域网格高亮 ── */}
      <div
        className="absolute left-1/2 rounded-full"
        style={{
          top: "55%",
          width: "320px",
          height: "320px",
          transform: "translate(-50%, -50%)",
          opacity: intensity * 0.5,
          transition: "opacity 1.2s ease-out",
          background: `
            radial-gradient(circle at center,
              rgba(160,210,255,0.15) 0%,
              rgba(144,200,255,0.06) 30%,
              transparent 70%
            )
          `,
          boxShadow: intensity > 0.5
            ? `0 0 80px rgba(144,200,255,${intensity * 0.2}), inset 0 0 40px rgba(144,200,255,${intensity * 0.08})`
            : "none",
        }}
      />

      {/* ── 扫描线覆盖 ── */}
      <div
        className="absolute inset-0"
        style={{
          opacity: intensity * 0.12,
          background: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(144,200,255,0.03) 2px,
              rgba(144,200,255,0.03) 4px
            )
          `,
        }}
      />
    </div>
  );
};

export default MatrixGrid;
