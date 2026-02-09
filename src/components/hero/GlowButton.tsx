"use client";

import React, { useRef, useEffect } from "react";

export default function GlowVortexButton({
  onClick,
  className,
}: {
  onClick?: () => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    let animationFrameId: number;

    const W = 60;
    const H = 60;
    canvas.width = W;
    canvas.height = H;

    const centerX = W / 2;
    const centerY = H / 2;

    // 粒子数量
    const particleCount = 180;

    // 初始化粒子：从外层开始
    const particles = Array.from({ length: particleCount }, (_, i) => {
      const t = i / particleCount;
      return {
        radius: 25 + Math.random() * 5, // 外层开始
        angle: Math.random() * Math.PI * 2,
        size: 0.8 + Math.random() * 1.2,
        drift: Math.random() * Math.PI * 2,
        speed: 0.015 + Math.random() * 0.01,
      };
    });

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // === 1. 外层淡淡星云光晕 ===
      const glow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30);
      glow.addColorStop(0, "rgba(150,200,255,0.15)");
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // === 2. 黑洞吸积盘螺旋粒子 ===
      particles.forEach((p) => {
        // 半径不断减小 → 吸入中心
        p.radius -= 0.05;

        // 如果吸到中心 → 重置到外层
        if (p.radius < 2) {
          p.radius = 25 + Math.random() * 5;
        }

        // 角度不断增加 → 旋转
        p.angle += p.speed;

        // 噪声扰动（让云更自然）
        const noise = Math.sin(p.drift + p.angle * 3) * 1.2;

        // 螺旋结构：角度 + 半径耦合
        const x = centerX + Math.cos(p.angle + p.radius * 0.05) * (p.radius + noise);
        const y = centerY + Math.sin(p.angle + p.radius * 0.05) * (p.radius + noise);

        // 深度感：越靠近中心越亮
        const opacity = Math.min(1, (30 - p.radius) / 30) * 0.5;

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,220,255,${opacity})`;
        ctx.fill();
      });

      // === 3. 中心奇点（永远最亮，不被遮挡） ===
      const pulse = 1 + Math.sin(Date.now() * 0.006) * 0.3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 1.4 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#88ccff";
      ctx.fill();
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onClick={onClick}
      className={`cursor-pointer hover:scale-110 active:scale-95 transition-transform ${className}`}
      width={60}
      height={60}
    />
  );
}
