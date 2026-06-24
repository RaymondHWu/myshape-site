"use client";
import React, { useEffect, useState, useRef } from "react";
import "./genesis-badge.css";

export default function GenesisBadge() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState("");
  const badgeRef = useRef<HTMLDivElement>(null);

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

  if (!visible) return null;

  const isGenesis = status === "GENESIS_NODE";

  return (
    <div className="genesis-badge-wrapper">
      <div ref={badgeRef} className={`genesis-badge ${isGenesis ? "tier-genesis" : "tier-active"}`}>
        {/* 粒子辉光背景 */}
        <div className="badge-bg-glow" />

        {/* 四角锚点 */}
        <div className="badge-corner badge-corner-tl" />
        <div className="badge-corner badge-corner-tr" />
        <div className="badge-corner badge-corner-bl" />
        <div className="badge-corner badge-corner-br" />

        {/* 扫描线 */}
        <div className="badge-scan" />

        {/* 内容 */}
        <div className="badge-content">
          {/* 协议顶栏 */}
          <div className="badge-topbar">
            <span className="badge-code">SIG_006_OMEGA</span>
            <span className="badge-dots">
              <span className="badge-dot" />
              <span className="badge-dot" />
            </span>
          </div>

          {/* 核心标题 */}
          <div className="badge-title-main" data-text="GENESIS_COHORT">
            GENESIS_COHORT
          </div>
          <div className="badge-title-sub">
            FOUNDING_ENTITY
          </div>

          {/* 底部数据 */}
          <div className="badge-data-row">
            <span>TIER: <strong>OMEGA</strong></span>
            <span>STATUS: <strong>VALIDATED</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
