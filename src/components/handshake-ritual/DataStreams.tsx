"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ──────────────────────────────────────────────
   DataStreams — 定向贝塞尔粒子注入流

   粒子从画面边缘沿贝塞尔曲线汇聚到核心原点。
   使用单一 Points 几何体 + drawRange 实现高性能渲染。
   每帧更新粒子位置，通过 drawRange 控制可见数量。

   设计约束：
   - MAX_PARTICLES = 2000 (预分配)
   - 每个粒子用 quadratic bezier 曲线
   - intensity (0→1) 控制活跃粒子密度
   - idle=0 条流, connecting≈300, sovereign≈1200
   ────────────────────────────────────────────── */

const MAX_PARTICLES = 2000;

interface ParticleData {
  /** 贝塞尔起点 (屏幕边缘方向) */
  p0: THREE.Vector3;
  /** 贝塞尔控制点 (偏移产生弧线) */
  p1: THREE.Vector3;
  /** 贝塞尔终点 (核心原点附近) */
  p2: THREE.Vector3;
  /** 曲线进度 t ∈ [0, 1] */
  t: number;
  /** 每帧 t 增量 (0.001 ~ 0.008) */
  speed: number;
}

interface DataStreamsProps {
  /** 0→1 控制活跃粒子数量与速度 */
  intensity: number;
  /** 粒子颜色 (idle 冷蓝, sovereign 白金色) */
  color?: string;
}

/* ── 生成随机贝塞尔曲线 ── */
function spawnParticle(): ParticleData {
  // 在单位球面上取随机方向作为起点方向
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const radius = 3.5 + Math.random() * 3.0; // 起点距离 3.5~6.5

  const p0 = new THREE.Vector3(
    Math.sin(phi) * Math.cos(theta) * radius,
    Math.sin(phi) * Math.sin(theta) * radius,
    Math.cos(phi) * radius
  );

  // 终点：原点附近微小偏移
  const p2 = new THREE.Vector3(
    (Math.random() - 0.5) * 0.3,
    (Math.random() - 0.5) * 0.3,
    (Math.random() - 0.5) * 0.3
  );

  // 控制点：p0→p2 中点 + 垂直偏移 → 产生弧线
  const mid = new THREE.Vector3().addVectors(p0, p2).multiplyScalar(0.5);
  const dir = new THREE.Vector3().subVectors(p2, p0).normalize();
  const perp = new THREE.Vector3(
    (Math.random() - 0.5) * 2.0,
    (Math.random() - 0.5) * 2.0,
    (Math.random() - 0.5) * 2.0
  );
  // 将 perp 投影到与 dir 正交的平面
  perp.sub(dir.clone().multiplyScalar(perp.dot(dir)));
  perp.normalize().multiplyScalar(1.0 + Math.random() * 2.5);
  const p1 = mid.clone().add(perp);

  const speed = 0.0015 + Math.random() * 0.006;

  return { p0, p1, p2, t: 0, speed };
}

/* ── 贝塞尔求值 ── */
function bezierPoint(p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, t: number, out: THREE.Vector3) {
  const mt = 1 - t;
  out.set(
    mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
    mt * mt * p0.z + 2 * mt * t * p1.z + t * t * p2.z
  );
}

const DataStreams: React.FC<DataStreamsProps> = ({
  intensity,
  color = "#90c8ff",
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  /* ── 预分配几何体 ── */
  const geometry = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3);
    // 初始全部放到远离视野的位置
    for (let i = 0; i < MAX_PARTICLES; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -100;
      positions[i * 3 + 2] = 0;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setDrawRange(0, 0);
    return geo;
  }, []);

  /* ── 粒子状态池 (CPU side) ── */
  const poolRef = useRef<ParticleData[]>(
    Array.from({ length: MAX_PARTICLES }, () => spawnParticle())
  );
  // 粒子到达核心后的冷却帧数（防止立刻重生导致闪烁）
  const cooldownRef = useRef<Float32Array>(
    new Float32Array(MAX_PARTICLES)
  );

  const activeCountRef = useRef(0);

  /* ── 复用的临时向量（避免每帧 new THREE.Vector3） ── */
  const tmpVecRef = useRef(new THREE.Vector3());

  /* ── 目标活跃粒子数 ── */
  const targetCount = useMemo(() => {
    return Math.floor(intensity * MAX_PARTICLES);
  }, [intensity]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const geom = pointsRef.current.geometry;
    const posAttr = geom.attributes.position;
    const posArr = posAttr.array as Float32Array;
    const pool = poolRef.current;
    const cooldown = cooldownRef.current;

    let activeCount = activeCountRef.current;

    // ── 更新所有活跃粒子位置 ──
    const tmp = tmpVecRef.current;
    for (let i = 0; i < activeCount; i++) {
      const p = pool[i];
      p.t += p.speed;

      if (p.t >= 1.0) {
        // 粒子到达核心 → 设置 cooldown
        cooldown[i] = 10 + Math.floor(Math.random() * 30);
        // 把它移到原点（融入核心）
        posArr[i * 3] = p.p2.x;
        posArr[i * 3 + 1] = p.p2.y;
        posArr[i * 3 + 2] = p.p2.z;
      } else {
        bezierPoint(p.p0, p.p1, p.p2, p.t, tmp);
        posArr[i * 3] = tmp.x;
        posArr[i * 3 + 1] = tmp.y;
        posArr[i * 3 + 2] = tmp.z;
      }
    }

    // ── 回收 cooldown 粒子 → 活跃池尾端 swap ──
    for (let i = 0; i < activeCount; i++) {
      if (cooldown[i] > 0) {
        cooldown[i]--;
        if (cooldown[i] === 0) {
          // 重生这个粒子
          const fresh = spawnParticle();
          pool[i] = fresh;
          posArr[i * 3] = fresh.p0.x;
          posArr[i * 3 + 1] = fresh.p0.y;
          posArr[i * 3 + 2] = fresh.p0.z;
        }
      }
    }

    // ── 调整活跃数量以匹配 targetCount ──
    const speed = 0.3 * intensity + 0.5;
    if (activeCount < targetCount) {
      // 逐个激活
      const toActivate = Math.min(
        Math.ceil((targetCount - activeCount) * 0.1 * speed),
        targetCount - activeCount,
        10 // 每帧最多激活 10 个，避免突变
      );
      for (let j = 0; j < toActivate; j++) {
        if (activeCount >= MAX_PARTICLES) break;
        const fresh = spawnParticle();
        pool[activeCount] = fresh;
        cooldown[activeCount] = 0;
        posArr[activeCount * 3] = fresh.p0.x;
        posArr[activeCount * 3 + 1] = fresh.p0.y;
        posArr[activeCount * 3 + 2] = fresh.p0.z;
        activeCount++;
      }
    } else if (activeCount > targetCount) {
      // 逐个停用
      const toDeactivate = Math.min(
        Math.ceil((activeCount - targetCount) * 0.08),
        activeCount - targetCount,
        10
      );
      for (let j = 0; j < toDeactivate; j++) {
        if (activeCount <= 0) break;
        activeCount--;
        // 移到视野外
        posArr[activeCount * 3] = 0;
        posArr[activeCount * 3 + 1] = -100;
        posArr[activeCount * 3 + 2] = 0;
      }
    }

    activeCountRef.current = activeCount;
    geom.setDrawRange(0, activeCount);
    posAttr.needsUpdate = true;

    // ── 动态调整材质 ──
    const mat = pointsRef.current.material as THREE.PointsMaterial;
    mat.opacity = 0.25 + intensity * 0.55;
    mat.size = 0.012 + intensity * 0.018;

    // 颜色过渡：低 intensity 冷蓝，高 intensity 白金
    if (intensity > 0.6) {
      const blend = (intensity - 0.6) / 0.4;
      const r = 0.56 + blend * 0.38;  // 0.56→0.94
      const g = 0.78 + blend * 0.18;  // 0.78→0.96
      const b = 1.0 - blend * 0.05;   // 1.0→0.95
      mat.color.setRGB(r, g, b);
    } else {
      mat.color.set(color);
    }
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color={color}
        size={0.015}
        transparent
        opacity={0.3}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
        sizeAttenuation
      />
    </points>
  );
};

export default DataStreams;
