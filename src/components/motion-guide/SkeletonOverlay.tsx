"use client";

/**
 * SkeletonOverlay — Ethereal Data Energy Wireframe Canvas
 *
 * Renders a lightweight wireframe skeleton on an HTML canvas,
 * overlaying the camera feed. Visualizes:
 *   - 18 MediaPipe pose bones as ethereal cyan lines
 *   - 9 mandatory anchor joints with glow (green=visible, red=missing)
 *   - Scanning ethereal energy band (vertical sweep)
 *
 * Fully decoupled from MotionGuide — reads raw landmark positions
 * and visibility, renders directly to canvas.
 */

import { useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════
// MediaPipe 33-pt Bone Topology (same as MotionDemoClient POSE_BONES)
// ═══════════════════════════════════════════════════════════════════

const POSE_BONES: [number, number][] = [
  [11, 12], [11, 13], [12, 14], [13, 15], [14, 16], // arms
  [11, 23], [12, 24], [23, 24], [23, 25], [24, 26], [25, 27], [26, 28], // lower
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8], // face
];

const ANCHOR_INDICES = new Set([0, 11, 12, 13, 14, 15, 16, 23, 24]);

// ═══════════════════════════════════════════════════════════════════
// Component Props
// ═══════════════════════════════════════════════════════════════════

interface SkeletonOverlayProps {
  /** Array of 33 MediaPipe landmarks: { x, y, z, visibility? }. x/y in [0,1] */
  landmarks: Array<{ x: number; y: number; z: number; visibility?: number }> | null;
  /** Canvas element width (px) */
  width: number;
  /** Canvas element height (px) */
  height: number;
  /** Whether to draw the overlay */
  active: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════

export default function SkeletonOverlay({ landmarks, width, height, active }: SkeletonOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanYRef = useRef(0);
  const lastDrawRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const draw = (now: number) => {
      const dt = lastDrawRef.current ? (now - lastDrawRef.current) / 1000 : 0.016;
      lastDrawRef.current = now;

      ctx.clearRect(0, 0, width, height);

      if (!active || !landmarks || landmarks.length < 29) {
        animId = requestAnimationFrame(draw);
        return;
      }

      // ── Scanning band advance ──
      scanYRef.current += dt * 0.45; // ~2.2s per full scan
      if (scanYRef.current > 1.05) scanYRef.current = -0.05;
      const bandY = scanYRef.current * height;

      // ── Draw bones ──
      for (const [a, b] of POSE_BONES) {
        const la = landmarks[a];
        const lb = landmarks[b];
        if (!la || !lb) continue;

        const ax = la.x * width;
        const ay = la.y * height;
        const bx = lb.x * width;
        const by = lb.y * height;

        // Distance from scan band → modulate opacity
        const midY = (ay + by) / 2;
        const distFromBand = Math.abs(midY - bandY) / height;
        const scanFactor = Math.max(0, 1 - distFromBand / 0.08); // 8% band
        const baseAlpha = 0.18;
        const alpha = baseAlpha + scanFactor * 0.45;

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = `rgba(144,200,255,${alpha.toFixed(2)})`;
        ctx.lineWidth = 1.0;
        ctx.stroke();

        // Bone midpoint glow (ethereal energy node)
        if (scanFactor > 0.5) {
          const mx = (ax + bx) / 2;
          const my = (ay + by) / 2;
          const glow = ctx.createRadialGradient(mx, my, 0, mx, my, 6);
          glow.addColorStop(0, `rgba(200,235,255,${(scanFactor * 0.5).toFixed(2)})`);
          glow.addColorStop(1, "rgba(144,200,255,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(mx, my, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ── Draw joint points + anchor indicators ──
      for (let i = 0; i < landmarks.length; i++) {
        const lm = landmarks[i];
        if (!lm) continue;

        const jx = lm.x * width;
        const jy = lm.y * height;
        const vis = lm.visibility ?? 1.0;
        const isAnchor = ANCHOR_INDICES.has(i);
        const anchorValid = vis > 0.5;

        if (isAnchor) {
          // Anchor ring
          const ringColor = anchorValid
            ? "rgba(34,211,238,0.6)"
            : "rgba(239,68,68,0.5)";
          const ringGlow = anchorValid
            ? "0 0 8px rgba(34,211,238,0.4)"
            : "0 0 6px rgba(239,68,68,0.3)";

          ctx.beginPath();
          ctx.arc(jx, jy, 4, 0, Math.PI * 2);
          ctx.strokeStyle = ringColor;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Anchor dot center
          ctx.beginPath();
          ctx.arc(jx, jy, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = anchorValid
            ? "rgba(34,211,238,0.9)"
            : "rgba(239,68,68,0.7)";
          ctx.fill();
        } else {
          // Non-anchor joint: subtle dot
          const alpha = 0.15 + vis * 0.15;
          ctx.beginPath();
          ctx.arc(jx, jy, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(180,220,255,${alpha.toFixed(2)})`;
          ctx.fill();
        }
      }

      // ── Scanning band visual ──
      const bandGrad = ctx.createLinearGradient(0, bandY - 14, 0, bandY + 14);
      bandGrad.addColorStop(0, "rgba(34,211,238,0)");
      bandGrad.addColorStop(0.4, "rgba(34,211,238,0.04)");
      bandGrad.addColorStop(0.5, "rgba(34,211,238,0.1)");
      bandGrad.addColorStop(0.6, "rgba(34,211,238,0.04)");
      bandGrad.addColorStop(1, "rgba(34,211,238,0)");
      ctx.fillStyle = bandGrad;
      ctx.fillRect(0, bandY - 14, width, 28);

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, [landmarks, width, height, active]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 w-full h-full z-10 pointer-events-none"
      style={{ opacity: active ? 1 : 0, transition: "opacity 0.5s" }}
    />
  );
}
