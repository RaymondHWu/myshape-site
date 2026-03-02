"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link"; // 1. 引入 Link 组件

/* ---------------------- 卡片组件 ---------------------- */

const CapabilityCard = ({
  index,
  title,
  line1,
  line2,
  line3,
  params,
  side,
  motionType,
}: any) => {
  const [isHovered, setIsHovered] = useState(false);
  const themeColor = "144, 200, 255";

  // 定义 Primitive 激活音效
  const playPrimitiveTick = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(750, audioCtx.currentTime); 
      
      gainNode.gain.setValueAtTime(0.012, audioCtx.currentTime); 
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.05);
      oscillator.stop(audioCtx.currentTime + 0.05);
    } catch (e) { /* 忽略拦截 */ }
  }, []);

  return (
    <div 
      className={`cap-box ${side}`}
      onMouseEnter={() => {
        setIsHovered(true);
        playPrimitiveTick();
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="cap-scan-line" />

      <div className="cap-inner">
        <div className="cap-header">
          <span className="cap-index">PRIMITIVE_{index}</span>
          <div className={`cap-visual-icon ${motionType}`}>
            <div className="core-dot" />
            <div className="ring r1" />
            <div className="ring r2" />
          </div>
        </div>

        <div className="cap-body">
          <h3 className="cap-title">{title}</h3>
          <p className="cap-text-main">{line1}</p>
          <p className="cap-text-sub">{line2}</p>
          <p className="cap-text-highlight">{line3}</p>
        </div>

        <div className="cap-footer">
          {Object.entries(params).map(([k, v]: any) => (
            <div key={k} className="param-row">
              <span className="param-key">{k}</span>
              <span className="param-val">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .cap-box {
          position: relative;
          width: 320px;
          height: 380px;
          background: transparent;
          border: 1px solid rgba(144, 200, 255, 0.1);
          border-radius: 12px;
          padding: 2.2rem;
          transition: all 0.7s cubic-bezier(0.2, 1, 0.3, 1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .left   { transform: translateY(-30px); }
        .center { transform: translateY(50px); z-index: 2; }
        .right  { transform: translateY(-10px); }

        .cap-box:hover {
          background: radial-gradient(circle at top right, rgba(144, 200, 255, 0.05) 0%, transparent 70%);
          border-color: rgba(144, 200, 255, 0.35);
          z-index: 10 !important;
          box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.3);
        }

        .left:hover   { transform: translateY(-45px) scale(1.01); }
        .center:hover { transform: translateY(35px) scale(1.01); }
        .right:hover  { transform: translateY(-25px) scale(1.01); }

        .cap-inner {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .cap-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
        }

        .cap-index {
          font-family: monospace;
          font-size: 0.7rem;
          color: rgba(144, 200, 255, 0.4);
          letter-spacing: 0.2em;
        }

        .cap-visual-icon {
          position: relative;
          width: 24px;
          height: 24px;
        }

        .core-dot {
          position: absolute;
          left: 50%; top: 50%; width: 2px; height: 2px;
          background: #fff; border-radius: 50%;
          transform: translate(-50%, -50%);
        }

        .ring {
          position: absolute;
          inset: 0;
          border: 1px solid rgba(144, 200, 255, 0.2);
          border-radius: 50%;
        }

        .lock .r1 { animation: pulse 3s infinite; }
        .privacy::after {
          content: "";
          position: absolute;
          top: 0; left: 0; width: 100%; height: 1px;
          background: rgba(144, 200, 255, 0.6); 
          box-shadow: 0 0 8px rgba(144, 200, 255, 0.4);
          animation: scanLine 2.5s infinite ease-in-out;
        }
        .omni .r1 { animation: spread 4s infinite linear; }

        @keyframes pulse {
          0% { transform: scale(0.6); opacity: 0; }
          50% { opacity: 0.4; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        @keyframes scanLine {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(24px); opacity: 0; }
        }

        @keyframes spread {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        .cap-title { 
          font-size: 1.2rem; 
          font-weight: 300; 
          color: #fff; 
          margin: 0 0 1rem 0; 
          letter-spacing: 0.02em; 
        }
        .cap-text-main { 
          font-size: 0.9rem; 
          font-weight: 300; 
          line-height: 1.6; 
          color: rgba(255,255,255,0.75); 
          margin-bottom: 0.5rem; 
        }
        .cap-text-sub { 
          font-size: 0.85rem; 
          font-weight: 300; 
          line-height: 1.6; 
          color: rgba(255,255,255,0.35); 
          margin-bottom: 0.8rem; 
        }
        .cap-text-highlight { 
          font-size: 0.8rem; 
          font-weight: 300; 
          color: rgba(144, 200, 255, 0.6); 
          text-transform: uppercase; 
          letter-spacing: 0.1em; 
        }

        .cap-footer { 
          margin-top: auto; 
          padding-top: 1.2rem; 
          border-top: 1px solid rgba(144, 200, 255, 0.08); 
        }
        .param-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .param-key { font-size: 0.7rem; opacity: 0.3; font-weight: 300; text-transform: uppercase; }
        .param-val { font-size: 0.7rem; opacity: 0.6; color: rgba(144, 200, 255, 0.8); font-family: monospace; }

        .cap-scan-line {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent, rgba(144, 200, 255, 0.01), transparent);
          background-size: 100% 4px; pointer-events: none;
        }
      `}</style>
    </div>
  );
};

/* ---------------------- 主模块 ---------------------- */

export default function Capabilities() {
  return (
    <section style={{ 
      width: "100%", 
      padding: "10rem 6%", 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center",
      background: "transparent"
    }}>
      
      <div style={{ width: "100%", maxWidth: "1200px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "10rem" }}>
        <div style={{ maxWidth: "650px" }}>
          <span style={{ fontSize: "0.75rem", letterSpacing: "0.6em", color: "rgba(144, 200, 255, 0.4)", display: "block", marginBottom: "1.5rem" }}>
            CAPABILITIES
          </span>
          <h2 style={{ fontSize: "3.2rem", fontWeight: 300, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#fff", margin: 0 }}>
            Sovereignty as <span style={{ color: "rgba(144, 200, 255, 0.8)" }}>Protocol.</span>
          </h2>
          <p style={{ fontSize: "1.1rem", fontWeight: 300, color: "rgba(255,255,255,0.7)", marginTop: "1.8rem", maxWidth: "550px", lineHeight: 1.7 }}>
            A unified suite of primitives for secure, behavioral identity in the age of AI.
          </p>
        </div>

        {/* 2. 修改右侧区域：增加跳转按钮 */}
        <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2rem" }}>
          <div style={{ 
            fontSize: "0.8rem", opacity: 0.3, color: "rgba(144,200,255,0.7)", 
            textAlign: "right", borderRight: "1px solid rgba(144,200,255,0.15)", 
            paddingRight: "1.5rem", lineHeight: "1.8", fontFamily: "monospace"
          }}>
            PROTOCOL_CORE_V1.86<br />// STREAM: ENCRYPTED<br />// STATE: ACTIVE
          </div>
          
          <Link href="/protocol" style={{ textDecoration: 'none' }}>
            <div style={{ 
              padding: "0.8rem 1.5rem", 
              border: "1px solid rgba(144, 200, 255, 0.3)", 
              color: "rgba(144, 200, 255, 0.8)",
              fontSize: "0.7rem",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.3s"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(144, 200, 255, 0.1)";
              e.currentTarget.style.color = "#fff";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "rgba(144, 200, 255, 0.8)";
            }}
            >
              Access_System_Core →
            </div>
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", maxWidth: "1200px", gap: "3rem" }}>
        <CapabilityCard
          index="01" side="left" motionType="lock"
          title="Neural Lock"
          line1="Bind identity to your biological signature."
          line2="A cryptographic tether forged from your unique physiological topology."
          line3="Unforgeable. Uncopyable. Irreversible."
          params={{ BIOMETRIC_HASH: "SEALED", FORGE_RISK: "NULL" }}
        />
        <CapabilityCard
          index="02" side="center" motionType="privacy"
          title="ZK-Privacy"
          line1="Protect your geometry with zero-knowledge proofs."
          line2="Verification without exposure. Data never leaves the enclave."
          line3="EXPOSURE: ZERO. PRIVACY: ABSOLUTE."
          params={{ EXPOSURE: "ZERO", ZK_STATE: "ACTIVE" }}
        />
        <CapabilityCard
          index="03" side="right" motionType="omni"
          title="Omni-Presence"
          line1="Deploy one identity across infinite agents."
          line2="A unified protocol body that persists across systems."
          line3="SYNC: CONTINUOUS. PERSISTENCE: 100%."
          params={{ SYNC_STATE: "CONTI", AGENT_LINKS: "ACTIVE" }}
        />
      </div>
    </section>
  );
}