"use client";

import React, { useState } from "react";

/* ---------------------- 卡片组件 ---------------------- */
interface CardProps {
  index: number;
  glyph: string;
  title: string;
  desc1: string;
  desc2?: string;
}

const VisionCard = ({ index, glyph, title, desc1, desc2 }: CardProps) => {
  const [hover, setHover] = useState(false);
  // 核心统一色值
  const themeColor = "144, 200, 255"; 

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="vision-card-container"
    >
      <div className="v-scan-line" />

      <div className="vision-card-header">
         <div className={`vision-glyph ${hover ? 'active' : ''}`}>
            {glyph}
          </div>
          <div className="vision-card-index">
            V_{String(index).padStart(2, "0")}
          </div>
      </div>

      <div className={`vision-text-wrapper ${hover ? 'text-active' : ''}`}>
        <h3 className="vision-card-title">{title}</h3>
        <p className="vision-card-desc-main">{desc1}</p>
        {desc2 && <p className="vision-card-desc-sub">{desc2}</p>}
      </div>

      <style jsx>{`
        .vision-card-container {
          position: relative;
          width: 100%;
          padding: 1.5rem;
          border-radius: 12px; 
          border: 1px solid ${hover ? `rgba(${themeColor}, 0.4)` : `rgba(${themeColor}, 0.15)`};
          background-color: ${hover ? `rgba(${themeColor}, 0.05)` : `rgba(255, 255, 255, 0.02)`};
          transition: all 0.6s cubic-bezier(0.2, 1, 0.3, 1);
          transform: ${hover ? 'translateY(-6px)' : 'none'};
          box-shadow: ${hover ? `0 10px 30px rgba(0, 0, 0, 0.4)` : 'none'};
          cursor: default;
          overflow: hidden;
          font-family: var(--font-geist-sans), sans-serif;
          display: flex;
          flex-direction: column;
          min-height: 180px;
        }

        .vision-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.2rem;
        }

        .vision-glyph {
          font-size: 1.1rem;
          color: rgba(${themeColor}, 0.8);
          opacity: 0.6;
          transition: all 0.4s ease;
        }
        
        .vision-glyph.active {
          color: #fff;
          opacity: 1;
          animation: glitchPulse 0.4s infinite ease-out;
          text-shadow: 0 0 10px rgba(${themeColor}, 0.8);
        }

        .vision-card-index {
          font-family: monospace;
          font-size: 0.75rem;
          color: #90c8ff;
          opacity: 0.5;
          letter-spacing: 0.1em;
        }

        .vision-card-title {
          font-size: 1.2rem;
          font-weight: 300; /* 调大权重对齐下方 */
          color: #fff;
          margin: 0 0 0.8rem 0;
          letter-spacing: -0.01em;
        }

        .vision-card-desc-main {
          font-size: 0.95rem;
          font-weight: 300;
          line-height: 1.6;
          color: rgba(255,255,255,0.85);
        }

        .vision-card-desc-sub {
          font-size: 0.95rem;
          font-weight: 300;
          line-height: 1.6;
          color: rgba(255,255,255,0.4);
          margin-top: 0.3rem;
        }

        .v-scan-line {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent, rgba(${themeColor}, 0.03), transparent);
          background-size: 100% 4px;
          pointer-events: none;
        }

        @keyframes glitchPulse {
          0%, 100% { transform: scale(1) skew(0deg); }
          20% { transform: scale(1.1) skew(2deg); }
          50% { transform: scale(0.95) skew(-1deg); }
        }
      `}</style>
    </div>
  );
};

/* ---------------------- 主模块 ---------------------- */
export default function Vision() {
  const cards = [
    { glyph: "◈", title: "Biological Sovereignty", desc1: "Your geometry is your identity.", desc2: "Own the mathematical rights." },
    { glyph: "◇", title: "ZK‑Presence", desc1: "Verification without exposure.", desc2: "Identity withheld by default." },
    { glyph: "◎", title: "AI‑Native Existence", desc1: "Persistent across agents.", desc2: "Continuity in synthetic layers." },
    { glyph: "⊡", title: "Temporal Record", desc1: "Immutable history of presence.", desc2: "Decentralized state persistence." },
    { glyph: "⟁", title: "Kinematic Privacy", desc1: "End-to-end motion encryption.", desc2: "Secure physical intent." },
    { glyph: "⌬", title: "Neural Synthesis", desc1: "Bridge between form and code.", desc2: "Algorithmic self-definition." }
  ];

  return (
    <section style={{ 
      width: "100%", padding: "10rem 6%", display: "flex", 
      flexDirection: "column", alignItems: "center",
      fontFamily: "var(--font-geist-sans), sans-serif",
    }}>
      <div style={{ maxWidth: "1200px", width: "100%" }}>
        
        {/* 标题组：严格对齐 Capabilities */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8rem" }}>
          <div style={{ maxWidth: "650px" }}>
            <span style={{ fontSize: "0.75rem", letterSpacing: "0.6em", color: "rgba(144, 200, 255, 0.5)", display: "block", marginBottom: "1.5rem" }}>
              VISION
            </span>
            <h2 style={{ 
              fontSize: "3.2rem", 
              fontWeight: 400, // 增加权重，对齐 Sovereignty 的视觉量级
              letterSpacing: "-0.02em", 
              lineHeight: 1.1, 
              color: "#fff", 
              margin: 0 
            }}>
              Identity as <span style={{ color: "rgba(144, 200, 255, 0.9)" }}>Geometry.</span>
            </h2>
            <p style={{ 
              fontSize: "1.2rem", 
              fontWeight: 300, 
              color: "rgba(255,255,255,0.85)", 
              marginTop: "1.5rem", 
              maxWidth: "550px", 
              lineHeight: 1.6 
            }}>
              A cryptographic layer defining the future of human-AI interaction through motion-native primitives.
            </p>
          </div>

          {/* 右侧协议状态：色值变淡对齐 */}
          <div style={{
            fontSize: "0.9rem", opacity: 0.4, color: "rgba(144,200,255,0.7)", 
            textAlign: "right", borderRight: "1px solid rgba(144,200,255,0.2)", 
            paddingRight: "1.5rem", lineHeight: "1.6", fontFamily: "monospace", marginBottom: "5px"
          }}>
            PROTOCOL_VISION_V1.0<br />// STATE: ACTIVE
          </div>
        </div>

        {/* 网格布局 */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", 
          gap: "2.5rem" 
        }}>
          {cards.map((c, i) => (
            <VisionCard key={i} index={i + 1} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}