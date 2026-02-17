'use client';

import React, { useEffect, useRef } from 'react';

export default function HeroVisual({ showCore = true }: { showCore?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let stars: any[] = [];
    let coreParticles: any[] = [];

    const init = () => {
      stars = Array.from({ length: 400 }, () => ({
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random() * 2
      }));

      if (showCore) {
        coreParticles = Array.from({ length: 1500 }, () => ({
          angle: Math.random() * Math.PI * 2,
          radius: Math.random() * 150,
          y: (Math.random() - 0.5) * 300,
          speed: 0.02 + Math.random() * 0.02
        }));
      }
    };

    const resize = () => {
      // ⭐ 关键：HeroVisual 只覆盖 Hero 区域（100vh）
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const draw = () => {
      ctx.fillStyle = '#02040a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 星空背景
      stars.forEach(s => {
        s.z -= 0.005;
        if (s.z <= 0) s.z = 2;
        const x = canvas.width / 2 + (s.x / s.z) * canvas.width * 0.5;
        const y = canvas.height / 2 + (s.y / s.z) * canvas.height * 0.5;
        const size = (1 - s.z / 2) * 2;
        ctx.fillStyle = `rgba(128, 191, 255, ${1 - s.z / 2})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 中心粒子漩涡
      if (showCore) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        coreParticles.forEach(p => {
          p.angle += p.speed;
          const x = Math.cos(p.angle) * p.radius;
          const z = Math.sin(p.angle) * p.radius;
          const scale = 300 / (300 + z);
          ctx.fillStyle = `rgba(128, 191, 255, ${0.5 + scale * 0.5})`;
          ctx.beginPath();
          ctx.arc(x * scale, p.y * scale, 1.5 * scale, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }

      requestAnimationFrame(draw);
    };

    resize();
    init();
    draw();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [showCore]);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',   // ⭐ 关键：固定为 Hero 区域高度
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          imageRendering: 'pixelated' // ⭐ 防止白线
        }}
      />
    </div>
  );
}
