"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/* ──────────────────────────────────────────────
   MetaCore — 双层多面体加密转子

   外层：二十面体线框 (IcosahedronGeometry detail:2)
         → 162 顶点, 320 面, 协议防火墙边界
   内层：星状八面体 (OctahedronGeometry + displacement)
         → 反向旋转, 身份熵源

   双体反向旋转 → 密码学 Enigma 转子的现代视觉化
   ────────────────────────────────────────────── */

interface MetaCoreProps {
  /** 0→1 外壳线框不透明度 */
  outerOpacity: number;
  /** 0→1 内核不透明度 (idle=0, sovereign=1) */
  innerOpacity: number;
  /** 外壳自转速度 (rad/s 基准) */
  outerSpeed: number;
  /** 内核自转速度 (rad/s 基准，方向相反) */
  innerSpeed: number;
  /** 整体缩放 */
  scale?: number;
  /** 顶点节点发光强度 */
  nodeGlow: number;
  /** 线框颜色覆盖 */
  wireframeColor?: string;
  /** 内核颜色覆盖 */
  coreColor?: string;
}

/* ═══════════════════════════════════════════════
   外层：二十面体线框
   ═══════════════════════════════════════════════ */
const OuterShell: React.FC<{
  opacity: number;
  speed: number;
  color: string;
  nodeGlow: number;
}> = ({ opacity, speed, color, nodeGlow }) => {
  const groupRef = useRef<THREE.Group>(null);
  const lineRef = useRef<THREE.LineSegments>(null);
  const nodeRef = useRef<THREE.Points>(null);

  /* ── 构建二十面体线框 + 顶点 ── */
  const { edgeGeo, vertexPositions } = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(1.0, 2);
    const posArr = ico.getAttribute("position");

    // 收集唯一边（基于 index）
    const indexAttr = ico.getIndex();
    if (!indexAttr) {
      // fallback: 无 index 时直接用 position
      const pts: number[] = [];
      for (let i = 0; i < posArr.count; i++) {
        const x = posArr.getX(i);
        const y = posArr.getY(i);
        const z = posArr.getZ(i);
        pts.push(x, y, z);
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(pts, 3)
      );
      ico.dispose();
      return {
        edgeGeo: geo,
        vertexPositions: new Float32Array(pts),
        vertexCount: posArr.count,
      };
    }

    const edgeSet = new Set<string>();
    const edgePts: number[] = [];

    for (let i = 0; i < indexAttr.count; i += 3) {
      const a = indexAttr.getX(i);
      const b = indexAttr.getX(i + 1);
      const c = indexAttr.getX(i + 2);

      const addEdge = (u: number, v: number) => {
        const key = u < v ? `${u}-${v}` : `${v}-${u}`;
        if (!edgeSet.has(key)) {
          edgeSet.add(key);
          edgePts.push(
            posArr.getX(u), posArr.getY(u), posArr.getZ(u),
            posArr.getX(v), posArr.getY(v), posArr.getZ(v)
          );
        }
      };

      addEdge(a, b);
      addEdge(b, c);
      addEdge(c, a);
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(edgePts, 3)
    );

    // 收集唯一顶点（用于节点）
    const vertSet = new Set<string>();
    const vertPts: number[] = [];
    for (let i = 0; i < posArr.count; i++) {
      const x = posArr.getX(i);
      const y = posArr.getY(i);
      const z = posArr.getZ(i);
      const key = `${x.toFixed(6)},${y.toFixed(6)},${z.toFixed(6)}`;
      if (!vertSet.has(key)) {
        vertSet.add(key);
        vertPts.push(x, y, z);
      }
    }

    ico.dispose();
    return {
      edgeGeo: lineGeo,
      vertexPositions: new Float32Array(vertPts),
      vertexCount: vertPts.length / 3,
    };
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    // 慢速自转
    groupRef.current.rotation.y += 0.005 * speed;
    groupRef.current.rotation.x = Math.sin(t * 0.3) * 0.08;

    if (lineRef.current) {
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = opacity;
    }
    if (nodeRef.current) {
      const mat = nodeRef.current.material as THREE.PointsMaterial;
      mat.opacity = 0.15 + nodeGlow * 0.7;
      mat.size = 0.018 + nodeGlow * 0.025;
    }
  });

  return (
    <group ref={groupRef}>
      {/* 线框 */}
      <lineSegments ref={lineRef} geometry={edgeGeo}>
        <lineBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </lineSegments>

      {/* 顶点能量节点 */}
      <points ref={nodeRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[vertexPositions, 3]}
            count={vertexPositions.length / 3}
            array={vertexPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#d0f0ff"
          size={0.02}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          depthTest={false}
        />
      </points>
    </group>
  );
};

/* ═══════════════════════════════════════════════
   内层：星状八面体
   通过对 OctahedronGeometry 顶点做位移 → 星芒效果
   ═══════════════════════════════════════════════ */
const InnerCore: React.FC<{
  opacity: number;
  speed: number;
  color: string;
}> = ({ opacity, speed, color }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    // detail:1 → 每个面细分一次，顶点数适中
    const octa = new THREE.OctahedronGeometry(0.42, 1);
    const posArr = octa.getAttribute("position");

    // 位移：沿法线方向推拉顶点 → 星状效果
    // 先计算近似法线（从原点指向顶点）
    for (let i = 0; i < posArr.count; i++) {
      const x = posArr.getX(i);
      const y = posArr.getY(i);
      const z = posArr.getZ(i);
      const len = Math.sqrt(x * x + y * y + z * z);
      if (len < 0.001) continue;

      const nx = x / len;
      const ny = y / len;
      const nz = z / len;

      // 扰动因子：基于顶点位置的伪随机
      const seed = (Math.sin(i * 17.31 + x * 7.13) * 0.5 + 0.5);
      const displacement = 1.0 + seed * 0.45;

      posArr.setXYZ(i, nx * displacement * 0.42, ny * displacement * 0.42, nz * displacement * 0.42);
    }

    octa.computeVertexNormals();
    return octa;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    // 反向旋转（与外壳方向相反）
    meshRef.current.rotation.y -= 0.006 * speed;
    meshRef.current.rotation.z = Math.sin(t * 0.5) * 0.1;

    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = opacity;
    // 内核材质随 opacity 切换颜色温度
    if (opacity > 0.5) {
      mat.color.set(color); // 白金色
    } else {
      mat.color.set("#90c8ff"); // 冷蓝
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
        wireframe={false}
      />
    </mesh>
  );
};

/* ═══════════════════════════════════════════════
   组合导出：MetaCore = 外壳 + 内核
   ═══════════════════════════════════════════════ */
const MetaCore: React.FC<MetaCoreProps> = ({
  outerOpacity,
  innerOpacity,
  outerSpeed,
  innerSpeed,
  scale = 1.0,
  nodeGlow,
  wireframeColor = "#90c8ff",
  coreColor = "#e8f4ff",
}) => {
  return (
    <group scale={[scale, scale, scale]}>
      {/* 外层：二十面体线框 + 顶点节点 */}
      <OuterShell
        opacity={outerOpacity}
        speed={outerSpeed}
        color={wireframeColor}
        nodeGlow={nodeGlow}
      />

      {/* 内层：星状八面体，反向旋转 */}
      <InnerCore
        opacity={innerOpacity}
        speed={innerSpeed}
        color={coreColor}
      />
    </group>
  );
};

export default MetaCore;
