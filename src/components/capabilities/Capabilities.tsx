"use client";

import React from "react";

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
  return (
    <div className={`cap-box ${side}`}>
      <div className="cap-scan-line" />

      <div className="cap-inner">
        {/* Header: 左指数，右图标 */}
        <div className="cap-header">
          <span className="cap-index">PRIMITIVE_{index}</span>
          <div className={`cap-visual-icon ${motionType}`}>
            <div className="core-dot" />
            <div className="ring r1" />
            <div className="ring r2" />
          </div>
        </div>

        {/* Body: 保持极简排版 */}
        <div className="cap-body">
          <h3 className="cap-title">{title}</h3>
          <p className="cap-text-main">{line1}</p>
          <p className="cap-text-sub">{line2}</p>
          <p className="cap-text-highlight">{line3}</p>
        </div>

        {/* Footer: 参数状态 */}
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
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(144, 200, 255, 0.15);
          border-radius: 12px;
          padding: 2rem;
          transition: transform 0.6s cubic-bezier(0.2, 1, 0.3, 1), 
                      background 0.4s ease, border-color 0.4s ease;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* 统一布局位移 */
        .left   { transform: translateY(-40px); }
        .center { transform: translateY(40px); margin: 0 -10px; z-index: 2; }
        .right  { transform: translateY(-20px); }

        /* 防止抖动的位移修复 */
        .cap-box:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(144, 200, 255, 0.4);
          z-index: 10 !important;
        }
        .left:hover   { transform: translateY(-55px) scale(1.02); }
        .center:hover { transform: translateY(25px) scale(1.02); }
        .right:hover  { transform: translateY(-35px) scale(1.02); }

        .cap-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2.5rem;
        }

        .cap-index {
          font-family: monospace;
          font-size: 0.75rem;
          color: #90c8ff;
          opacity: 0.5;
          letter-spacing: 0.1em;
        }

        /* 右上角小符号 */
        .cap-visual-icon {
          position: relative;
          width: 24px;
          height: 24px;
        }

        .core-dot {
          position: absolute;
          left: 50%; top: 50%; width: 3px; height: 3px;
          background: #fff; border-radius: 50%;
          transform: translate(-50%, -50%);
        }

        .ring {
          position: absolute;
          inset: 0;
          border: 1px solid rgba(144, 200, 255, 0.3);
          border-radius: 50%;
        }

        /* 符号动画修复 */
        .lock .r1 { animation: pulse 3s infinite; }
        .privacy::after {
          content: "";
          position: absolute;
          top: 0; left: 0; width: 100%; height: 1px;
          background: #fff; box-shadow: 0 0 6px #90c8ff;
          animation: scanLine 2s infinite ease-in-out;
        }
        .omni .r1 { animation: spread 4s infinite linear; }

        @keyframes pulse {
          0% { transform: scale(0.7); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: scale(1.3); opacity: 0; }
        }

        @keyframes scanLine {
          0% { transform: translateY(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(24px); opacity: 0; }
        }

        @keyframes spread {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        /* 文案排版 */
        .cap-title { font-size: 1.25rem; font-weight: 200; color: #fff; margin: 0 0 1rem 0; letter-spacing: -0.01em; }
        .cap-text-main { font-size: 0.95rem; font-weight: 300; line-height: 1.6; color: rgba(255,255,255,0.9); margin-bottom: 0.5rem; }
        .cap-text-sub { font-size: 0.95rem; font-weight: 300; line-height: 1.6; color: rgba(255,255,255,0.5); margin-bottom: 0.5rem; }
        .cap-text-highlight { font-size: 0.85rem; font-weight: 300; color: #90c8ff; text-transform: uppercase; letter-spacing: 0.05em; }

        .cap-footer { margin-top: auto; padding-top: 1rem; border-top: 1px solid rgba(144, 200, 255, 0.1); }
        .param-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .param-key { font-size: 0.8rem; opacity: 0.4; font-weight: 300; }
        .param-val { font-size: 0.8rem; opacity: 0.8; color: #90c8ff; font-family: monospace; }

        .cap-scan-line {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent, rgba(144, 200, 255, 0.03), transparent);
          background-size: 100% 4px; pointer-events: none;
        }
      `}</style>
    </div>
  );
};

/* ---------------------- 主模块 ---------------------- */

export default function Capabilities() {
  return (
    <section style={{ width: "100%", padding: "10rem 6%", display: "flex", flexDirection: "column", alignItems: "center" }}>
      
      {/* 统一标题组 - 与 Vision / HowItWorks 严格对齐 */}
      <div style={{ width: "100%", maxWidth: "1200px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "8rem" }}>
        <div style={{ maxWidth: "650px" }}>
          <span style={{ fontSize: "0.75rem", letterSpacing: "0.6em", color: "rgba(144, 200, 255, 0.5)", display: "block", marginBottom: "1.5rem" }}>
            CAPABILITIES
          </span>
          <h2 style={{ fontSize: "3.2rem", fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#fff", margin: 0 }}>
            Sovereignty as <span style={{ color: "rgba(144, 200, 255, 0.9)" }}>Protocol.</span>
          </h2>
          <p style={{ fontSize: "1.2rem", fontWeight: 300, color: "rgba(255,255,255,0.85)", marginTop: "1.5rem", maxWidth: "550px", lineHeight: 1.6 }}>
            A unified suite of primitives for secure, behavioral identity in the age of AI.
          </p>
        </div>

        {/* 右侧系统状态 - 严格对齐 */}
        <div style={{ 
          fontSize: "0.9rem", opacity: 0.4, color: "rgba(144,200,255,0.7)", 
          textAlign: "right", borderRight: "1px solid rgba(144,200,255,0.2)", 
          paddingRight: "1.5rem", lineHeight: "1.6", fontFamily: "monospace", marginBottom: "5px" 
        }}>
          PROTOCOL_CORE_V1.86<br />// STREAM: ENCRYPTED<br />// STATE: ACTIVE
        </div>
      </div>

      {/* 卡片展示区 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", maxWidth: "1200px", gap: "2.5rem" }}>
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