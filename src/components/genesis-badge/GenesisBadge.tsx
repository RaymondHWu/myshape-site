"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import "./genesis-badge.css";

interface Spark {
  id: number;
  x: number; // 0-100% along badge perimeter
  y: number;
  angle: number;
  distance: number;
  size: number;
  alpha: number;
  life: number;
}

let sparkId = 0;

export default function GenesisBadge() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState("");
  const [sparks, setSparks] = useState<Spark[]>([]);
  const badgeRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("genesis_completed") === "1") {
      setStatus(sessionStorage.getItem("genesis_status") || "ACTIVE");
      setVisible(true);
    }
  }, []);

  // 鼠标视差倾斜
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!badgeRef.current) return;
      const { clientX, clientY } = e;
      const { left, top, width, height } = badgeRef.current.getBoundingClientRect();
      const x = (clientX - (left + width / 2)) / 25;
      const y = (clientY - (top + height / 2)) / 25;
      badgeRef.current.style.transform = `perspective(800px) rotateY(${x}deg) rotateX(${-y}deg)`;
    };
    const reset = () => {
      if (badgeRef.current) badgeRef.current.style.transform = "perspective(800px) rotateY(0deg) rotateX(0deg)";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", reset);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", reset);
    };
  }, []);

  // 粒子散溢发射器
  const emitSpark = useCallback(() => {
    const angle = Math.random() * Math.PI * 2;
    const side = Math.floor(Math.random() * 4); // 0:top 1:right 2:bottom 3:left
    let x: number, y: number;
    const edgeRand = Math.random();

    switch (side) {
      case 0: x = edgeRand; y = 0; break;
      case 1: x = 1; y = edgeRand; break;
      case 2: x = edgeRand; y = 1; break;
      default: x = 0; y = edgeRand; break;
    }

    const id = ++sparkId;
    const spark: Spark = {
      id,
      x, y,
      angle: angle,
      distance: 0,
      size: 1 + Math.random() * 2.5,
      alpha: 0.7 + Math.random() * 0.3,
      life: 1,
    };
    setSparks(prev => [...prev.slice(-20), spark]);
  }, []);

  useEffect(() => {
    if (!visible) return;

    // 每 1.5~4 秒随机喷射 1~3 个粒子
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const count = 1 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) setTimeout(emitSpark, i * 60);
      timer = setTimeout(schedule, 1500 + Math.random() * 2500);
    };
    schedule();

    // 粒子动画循环
    const animate = () => {
      setSparks(prev =>
        prev
          .map(s => ({ ...s, distance: s.distance + 0.8, life: s.life - 0.015 }))
          .filter(s => s.life > 0)
      );
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(animRef.current);
    };
  }, [visible, emitSpark]);

  if (!visible) return null;

  const isGenesis = status === "GENESIS_NODE";

  return (
    <div className="genesis-badge-wrapper">
      <div ref={badgeRef} className={`genesis-badge ${isGenesis ? "tier-genesis" : "tier-active"}`}>
        {/* 粒子散溢 */}
        {sparks.map(s => {
          const dx = Math.cos(s.angle) * s.distance;
          const dy = Math.sin(s.angle) * s.distance;
          return (
            <div
              key={s.id}
              className="badge-spark"
              style={{
                left: `${s.x * 100}%`,
                top: `${s.y * 100}%`,
                width: `${s.size}px`,
                height: `${s.size}px`,
                opacity: s.alpha * s.life,
                transform: `translate(${dx}px, ${dy}px)`,
              }}
            />
          );
        })}

        {/* 粒子辉光背景 */}
        <div className="badge-bg-glow" />
        <div className="badge-corner badge-corner-tl" />
        <div className="badge-corner badge-corner-tr" />
        <div className="badge-corner badge-corner-bl" />
        <div className="badge-corner badge-corner-br" />
        <div className="badge-scan" />

        <div className="badge-content">
          <div className="badge-topbar">
            <span className="badge-code">SIG_006_OMEGA</span>
            <span className="badge-dots">
              <span className="badge-dot" />
              <span className="badge-dot" />
            </span>
          </div>

          <div className="badge-title-main" data-text="GENESIS_COHORT">
            GENESIS_COHORT
          </div>
          <div className="badge-title-sub">
            FOUNDING_ENTITY
          </div>

          <div className="badge-data-row">
            <span>TIER: <strong>OMEGA</strong></span>
            <span>STATUS: <strong>VALIDATED</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
