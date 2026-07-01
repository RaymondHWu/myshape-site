"use client";

import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ──────────────────────────────────────────────
   DataCorona — 零知识身份指纹

   基于 node_token 的确定性哈希，从 MetaCore 的
   二十面体顶点沿法线方向延伸出独特的星芒图案。
   每个唯一的 node_token → 视觉上可区分的指纹。

   渲染：LineSegments + AdditiveBlending
   性能：一次 draw call，所有线段在一个 BufferGeometry
   ────────────────────────────────────────────── */

interface DataCoronaProps {
  /** node_token 字符串 — 决定指纹形状的种子 */
  nodeToken: string | null;
  /** 0→1 延伸进度 (idle=0, sovereign=1) */
  intensity: number;
}

/* ── 确定性哈希函数 (djb2 变体) ── */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

/* ── Token 清洗：trim + 截断至安全长度 ── */
function sanitizeToken(raw: string | null): string {
  if (!raw) return "DEFAULT_SEED";
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "DEFAULT_SEED";
  return trimmed.slice(0, 256); // 防御性截断，防止超长字符串哈希耗时
}

/* ── 从 token + vertexIndex 计算位移值 [0.3, 1.0] ── */
function vertexDisplacement(token: string, vertexIndex: number): number {
  const combined = `${token}:${vertexIndex}`;
  const h = hashString(combined);
  // 归一化到 [0, 1]
  const normalized = ((h % 65536) + 65536) % 65536 / 65536;
  // 映射到 [0.3, 1.0]
  return 0.3 + normalized * 0.7;
}

/* ── 构建二十面体顶点 + 法线 ── */
function buildIcoVertices(): { positions: Float32Array; normals: Float32Array; count: number } {
  const ico = new THREE.IcosahedronGeometry(1.0, 2);
  const posArr = ico.getAttribute("position");

  // 去重顶点
  const vertMap = new Map<string, { pos: THREE.Vector3; normal: THREE.Vector3 }>();
  for (let i = 0; i < posArr.count; i++) {
    const x = posArr.getX(i);
    const y = posArr.getY(i);
    const z = posArr.getZ(i);
    const key = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`;
    if (!vertMap.has(key)) {
      const len = Math.sqrt(x * x + y * y + z * z);
      // 安全除法：二十面体顶点不会在原点，但保留防御
      const invLen = len > 0.0001 ? 1 / len : 1;
      vertMap.set(key, {
        pos: new THREE.Vector3(x, y, z),
        normal: new THREE.Vector3(x * invLen, y * invLen, z * invLen),
      });
    }
  }

  ico.dispose();

  const count = vertMap.size;
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  let idx = 0;
  for (const [, v] of vertMap) {
    positions[idx * 3] = v.pos.x;
    positions[idx * 3 + 1] = v.pos.y;
    positions[idx * 3 + 2] = v.pos.z;
    normals[idx * 3] = v.normal.x;
    normals[idx * 3 + 1] = v.normal.y;
    normals[idx * 3 + 2] = v.normal.z;
    idx++;
  }

  return { positions, normals, count };
}

const DataCorona: React.FC<DataCoronaProps> = ({ nodeToken, intensity }) => {
  const lineRef = useRef<THREE.LineSegments>(null);

  /* ── 构建指纹线段几何体 ── */
  const geometry = useMemo(() => {
    const { positions: verts, normals, count } = buildIcoVertices();
    // 每条线段：起点=顶点位置，终点=顶点+法线*位移
    const linePts = new Float32Array(count * 2 * 3);

    const token = sanitizeToken(nodeToken);

    for (let i = 0; i < count; i++) {
      const vx = verts[i * 3];
      const vy = verts[i * 3 + 1];
      const vz = verts[i * 3 + 2];
      const nx = normals[i * 3];
      const ny = normals[i * 3 + 1];
      const nz = normals[i * 3 + 2];
      const disp = vertexDisplacement(token, i);

      // 起点：顶点位置
      linePts[i * 6] = vx;
      linePts[i * 6 + 1] = vy;
      linePts[i * 6 + 2] = vz;

      // 终点：顶点 + 法线 * 位移 * 基础延伸长度
      // 基础延伸长度 0.35 → disp 在 [0.3, 1.0] → 最终 0.105~0.35
      const baseExtrusion = 0.35;
      linePts[i * 6 + 3] = vx + nx * disp * baseExtrusion;
      linePts[i * 6 + 4] = vy + ny * disp * baseExtrusion;
      linePts[i * 6 + 5] = vz + nz * disp * baseExtrusion;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(linePts, 3));
    return geo;
  }, [nodeToken]);

  /* ── 几何体清理：防止重置循环中内存泄漏 ── */
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame(({ clock }) => {
    if (!lineRef.current) return;
    const t = clock.getElapsedTime();

    const mat = lineRef.current.material as THREE.LineBasicMaterial;
    // intensity 驱动星芒整体延伸
    mat.opacity = intensity * (0.4 + Math.sin(t * 2.0) * 0.15);

    // 星芒整体沿法线缩放
    lineRef.current.scale.setScalar(0.3 + intensity * 0.7);
  });

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        color="#d8f0ff"
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
      />
    </lineSegments>
  );
};

export default DataCorona;
