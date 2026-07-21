"use client";

import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';

export default function IdentityScan({ nodeHandle }: { nodeHandle: string }) {
  return (
    // 高度缩小到 400px，位置居中
    <div className="relative w-full h-[400px] flex items-center justify-center opacity-70">
      <Canvas camera={{ position: [0, 0, 4] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} color="#00f2ff" intensity={1} />
        
        <Float speed={4} rotationIntensity={0.1} floatIntensity={0.5}>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[1.4, 64, 64]} />
            <MeshDistortMaterial
              color="#00f2ff"
              speed={3}
              distort={0.3}
              wireframe={true}
              transparent
              opacity={0.12} // 极低透明度，若隐若现
            />
          </mesh>
        </Float>

        {/* 淡淡的底座光环 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
          <ringGeometry args={[1.6, 1.62, 100]} />
          <meshBasicMaterial color="#00f2ff" transparent opacity={0.2} />
        </mesh>
      </Canvas>

      {/* 叠层标签：roddog03 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
        <p className="text-[11px] tracking-[0.6em] text-[#90c8ff]/40 font-mono mb-2">IDENTITY_ACTIVE</p>
        <h2 className="text-2xl font-extralight text-white/60 tracking-[0.3em] font-mono uppercase">
          {nodeHandle}
        </h2>
      </div>
    </div>
  );
}