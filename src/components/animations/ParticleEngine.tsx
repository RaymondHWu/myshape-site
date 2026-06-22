'use client';
import { useEffect, useRef } from 'react';

type ParticleEngineProps = {
  onComplete: () => void;
  centerYOffset?: number;
  durationMs?: number;
  colorRgb?: string; // "128, 191, 255"
};

export default function ParticleEngine({
  onComplete,
  centerYOffset = -50,
  durationMs = 3000,
  colorRgb = "128, 191, 255",
}: ParticleEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(1);
  const contractRef = useRef(1);   // 1=normal, <1=contracted
  const colorRef = useRef(colorRgb);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // 对齐首页 `HeroVisual` 的核心参数：1500 粒子 / 150 半径 / 300 垂直跨度
    // 并叠加“外→内收缩”的初始偏移与初始半径放大，确保收束过程肉眼可见
    const particles = Array.from({ length: 1500 }, () => {
      const baseRadius = Math.random() * 120;
      return {
        angle: Math.random() * Math.PI * 2,
        baseRadius,
        y: (Math.random() - 0.5) * 300,
        speed: 0.02 + Math.random() * 0.02,
        offX: (Math.random() - 0.5) * 2600,
        offY: (Math.random() - 0.5) * 2600,
      };
    });

    const startTime = Date.now();
    let isStabilized = false;
    let frameId: number;

    const onSpeedUp = () => { speedRef.current = 2.5; };
    const onSpeedDown = () => { speedRef.current = 1.8; }; // triggers smooth decay back to 1
    const onContract = () => { contractRef.current = 0.90; };
    const onExpand = () => { contractRef.current = 1; };
    const onRecolor = (e: Event) => { colorRef.current = (e as CustomEvent).detail?.color || "128, 191, 255"; };

    window.addEventListener('speed-up', onSpeedUp);
    window.addEventListener('speed-down', onSpeedDown);
    window.addEventListener('particle-contract', onContract);
    window.addEventListener('particle-expand', onExpand);
    window.addEventListener('particle-recolor', onRecolor as EventListener);

    const render = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const inv = Math.pow(1 - progress, 3);

      // Smooth contract animation — toward 0.90 or 1
      const contract = contractRef.current;
      const targetContract = contract < 0.95 ? 0.90 : 1;
      if (Math.abs(contract - targetContract) > 0.002) {
        contractRef.current += (targetContract - contract) * 0.08;
      }

      // Smooth speed decay — when above normal, gradually slow down
      if (speedRef.current > 1.02) {
        speedRef.current += (1 - speedRef.current) * 0.015;
      } else if (speedRef.current > 1) {
        speedRef.current = 1;
      }

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      ctx.save();
      ctx.translate(window.innerWidth / 2, window.innerHeight / 2 + centerYOffset);
      ctx.scale(contractRef.current, contractRef.current);

      particles.forEach(p => {
        p.angle += p.speed * speedRef.current;
        const r = p.baseRadius;
        const tx = Math.cos(p.angle) * r;
        const ty = p.y;
        const tz = Math.sin(p.angle) * r;

        const x = isStabilized ? tx : tx + (p.offX * inv);
        const y = isStabilized ? ty : ty + (p.offY * inv);

        const denom = 300 + tz;
        const scale = denom <= 1 ? 0.001 : 300 / denom;
        const alpha = Math.min(0.95, 0.5 + scale * 0.5);
        ctx.fillStyle = `rgba(${colorRef.current}, ${alpha})`;
        ctx.beginPath();
        const pr = Math.max(0.05, 1.5 * scale);
        ctx.arc(x * scale, y * scale, pr, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();

      if (progress >= 1 && !isStabilized) isStabilized = true;
      if (progress >= 1 && !completedRef.current) {
        completedRef.current = true;
        onCompleteRef.current();
      }
      frameId = requestAnimationFrame(render);
    };
    render();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('speed-up', onSpeedUp);
      window.removeEventListener('speed-down', onSpeedDown);
      window.removeEventListener('particle-contract', onContract);
      window.removeEventListener('particle-expand', onExpand);
      window.removeEventListener('particle-recolor', onRecolor as EventListener);
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameId);
    };
  }, [centerYOffset, durationMs, colorRgb]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        imageRendering: 'pixelated',
      }}
    />
  );
}