"use client";

import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import MetaCore from "./MetaCore";
import DataStreams from "./DataStreams";
import DataCorona from "./DataCorona";

/* ──────────────────────────────────────────────
   HandshakeVisual — Three.js Canvas 组合容器

   层级（从后到前）：
   DataStreams  → 粒子从边缘向核心汇聚
   DataCorona   → 顶点法线延伸星芒（身份指纹）
   MetaCore     → 双层多面体加密转子
   ────────────────────────────────────────────── */

interface VisualParams {
  /** 外壳线框不透明度 */
  outerOpacity: number;
  /** 内核不透明度 */
  innerOpacity: number;
  /** 外壳自转速度倍数 */
  outerSpeed: number;
  /** 内核自转速度倍数 */
  innerSpeed: number;
  /** 顶点节点发光强度 */
  nodeGlow: number;
  /** 粒子流强度 0→1 */
  streamIntensity: number;
  /** 星芒指纹强度 0→1 */
  coronaIntensity: number;
  /** 线框颜色 */
  wireframeColor: string;
  /** 内核颜色 */
  coreColor: string;
  /** 粒子流颜色 */
  streamColor: string;
  /** node_token (null = 未连接，使用默认指纹) */
  nodeToken: string | null;
}

interface HandshakeVisualProps {
  params: VisualParams;
}

/* ── 相机微动：营造"全息投影"的微妙不稳定感 ── */
const CameraDrift: React.FC = () => {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    camera.position.x = Math.sin(t * 0.25) * 0.08;
    camera.position.y = 0.15 + Math.sin(t * 0.35) * 0.06;
    camera.lookAt(0, -0.4, 0);
  });
  return null;
};

const HandshakeVisual: React.FC<HandshakeVisualProps> = ({ params }) => {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      <Canvas
        camera={{
          position: [0, 0.15, 4.2],
          fov: 42,
          near: 0.1,
          far: 30,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ background: "transparent" }}
        dpr={[1, 1.5]} // 限制像素比以保证性能
      >
        <CameraDrift />

        {/* 环境光 */}
        <ambientLight intensity={0.8} />

        {/* ── Layer 1: 粒子数据流（最底层） ── */}
        <DataStreams
          intensity={params.streamIntensity}
          color={params.streamColor}
        />

        {/* ── Layer 2: 身份指纹星芒 ── */}
        <group position={[0, -0.35, 0]}>
          <DataCorona
            nodeToken={params.nodeToken}
            intensity={params.coronaIntensity}
          />
        </group>

        {/* ── Layer 3: MetaCore 加密转子 ── */}
        <group position={[0, -0.35, 0]}>
          <MetaCore
            outerOpacity={params.outerOpacity}
            innerOpacity={params.innerOpacity}
            outerSpeed={params.outerSpeed}
            innerSpeed={params.innerSpeed}
            nodeGlow={params.nodeGlow}
            wireframeColor={params.wireframeColor}
            coreColor={params.coreColor}
            scale={0.7}
          />
        </group>
      </Canvas>
    </div>
  );
};

export default HandshakeVisual;
export type { VisualParams };
