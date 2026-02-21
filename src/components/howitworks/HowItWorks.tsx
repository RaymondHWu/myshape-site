"use client";

import React, { useCallback } from "react";

export default function HowItWorks() {
  // 核心音效生成器：根据步骤索引调整音调
  const playPipelineTick = useCallback((stepIndex: number) => {
    if (typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      // 频率随步骤上升：600Hz -> 800Hz -> 1000Hz，模拟流程的推进感
      const frequencies = [600, 800, 1000];
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequencies[stepIndex], audioCtx.currentTime); 
      
      gainNode.gain.setValueAtTime(0.015, audioCtx.currentTime);
      
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.06);
      oscillator.stop(audioCtx.currentTime + 0.06);
    } catch (e) { /* 忽略拦截 */ }
  }, []);

  return (
    <section
      style={{
        width: "100%",
        padding: "10rem 6%",
        background: "transparent",
        position: "relative",
        fontFamily: "var(--font-geist-sans), sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <style jsx>{`
        @keyframes pulseDot {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.5); opacity: 1; box-shadow: 0 0 15px #90c8ff; }
          100% { transform: scale(1); opacity: 0.8; }
        }

        @keyframes scanBeam {
          0% { left: -30%; opacity: 0; }
          20% { opacity: 1; }
          50% { left: 50%; opacity: 0.9; }
          80% { opacity: 1; }
          100% { left: 120%; opacity: 0; }
        }

        @keyframes droplet {
          0% { left: -10%; opacity: 0; transform: scale(0.6); }
          10% { opacity: 1; transform: scale(1); }
          50% { left: 50%; opacity: 0.9; transform: scale(1.15); }
          90% { opacity: 0.4; transform: scale(0.8); }
          100% { left: 110%; opacity: 0; transform: scale(0.6); }
        }

        .pipeline-line {
          position: absolute;
          top: 35px;
          left: 0;
          height: 1px;
          width: 100%;
          background: linear-gradient(90deg, transparent 0%, rgba(144, 200, 255, 0.2) 40%, rgba(144, 200, 255, 0.2) 60%, transparent 100%);
          z-index: 1;
        }

        .pipeline-line::after {
          content: "";
          position: absolute;
          top: 0; left: -30%; width: 30%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(144, 200, 255, 0.6), transparent);
          animation: scanBeam 2.8s infinite ease-in-out;
        }

        .pipeline-line::before {
          content: "";
          position: absolute;
          top: -3px; left: -10%; width: 6px; height: 6px;
          background: #90c8ff; border-radius: 50%;
          box-shadow: 0 0 12px rgba(144, 200, 255, 0.8);
          animation: droplet 3.2s infinite cubic-bezier(0.4, 0, 0.2, 1);
        }

        .step-container {
          cursor: default;
        }

        .text-motion-wrapper {
          transition: all 0.5s cubic-bezier(0.2, 1, 0.3, 1);
          border-left: 1px solid rgba(144, 200, 255, 0.2);
          padding-left: 1.5rem;
        }

        .text-item {
          transition: all 0.4s ease;
        }

        .step-container:hover .text-motion-wrapper {
          transform: translateX(10px);
          border-left: 1px solid rgba(144, 200, 255, 0.8);
          background: linear-gradient(90deg, rgba(144, 200, 255, 0.05), transparent);
        }

        .step-container:hover .text-item {
          color: #fff !important;
          opacity: 1 !important;
        }

        .step-container:hover .index-num {
          color: #90c8ff !important;
          letter-spacing: 0.3em;
        }
      `}</style>

      <div style={{ maxWidth: "1200px", width: "100%" }}>
        
        {/* 标题区 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "6rem" }}>
          <div style={{ maxWidth: "650px" }}>
            <span style={{ fontSize: "0.75rem", letterSpacing: "0.6em", color: "rgba(144, 200, 255, 0.5)", display: "block", marginBottom: "1.5rem" }}>
              HOW IT WORKS
            </span>
            <h2 style={{ fontSize: "3.2rem", fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1.1, color: "#fff", margin: 0 }}>
              The protocol behind <span style={{ color: "rgba(144, 200, 255, 0.9)" }}>your identity.</span>
            </h2>
            <p style={{ fontSize: "1.2rem", fontWeight: 300, color: "rgba(255,255,255,0.85)", marginTop: "1.5rem", maxWidth: "600px", lineHeight: 1.6 }}>
              A motion-native pipeline that turns how you move into a zero-knowledge identity.
            </p>
          </div>

          <div style={{ fontSize: "0.9rem", opacity: 0.4, color: "rgba(144,200,255,0.7)", textAlign: "right", borderRight: "1px solid rgba(144,200,255,0.2)", paddingRight: "1.5rem", lineHeight: "1.6", fontFamily: "monospace", marginBottom: "5px" }}>
            SYSTEM_PROCESS_V2.0<br />// PIPELINE: ACTIVE
          </div>
        </div>

        {/* 三步协议流网格 */}
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "4rem", marginTop: "4rem" }}>
          <div className="pipeline-line" />

          {/* STEP 01 */}
          <div className="step-container" style={{ position: "relative" }} onMouseEnter={() => playPipelineTick(0)}>
            <div style={{ width: "12px", height: "12px", background: "#fff", borderRadius: "50%", marginBottom: "3rem", zIndex: 2, position: "relative", animation: "pulseDot 2s infinite" }} />
            <div className="text-motion-wrapper">
              <span className="text-item index-num" style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#90c8ff", opacity: 0.5 }}>01</span>
              <h3 className="text-item" style={{ fontSize: "1.2rem", fontWeight: 200, color: "#fff", margin: "1rem 0" }}>LOCAL MOTION CAPTURE</h3>
              <p className="text-item" style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, fontWeight: 300 }}>On-device posture, balance, and micro-movement reading — processed locally.</p>
            </div>
          </div>

          {/* STEP 02 */}
          <div className="step-container" style={{ position: "relative" }} onMouseEnter={() => playPipelineTick(1)}>
            <div style={{ width: "12px", height: "12px", background: "#fff", borderRadius: "50%", marginBottom: "3rem", zIndex: 2, position: "relative", animation: "pulseDot 2s infinite 0.5s" }} />
            <div className="text-motion-wrapper">
              <span className="text-item index-num" style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#90c8ff", opacity: 0.5 }}>02</span>
              <h3 className="text-item" style={{ fontSize: "1.2rem", fontWeight: 200, color: "#fff", margin: "1rem 0" }}>BEHAVIORAL ENCODING</h3>
              <p className="text-item" style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, fontWeight: 300 }}>Movement becomes a compact identity vector — non-biometric and irreversible.</p>
            </div>
          </div>

          {/* STEP 03 */}
          <div className="step-container" style={{ position: "relative" }} onMouseEnter={() => playPipelineTick(2)}>
            <div style={{ width: "12px", height: "12px", background: "#fff", borderRadius: "50%", marginBottom: "3rem", zIndex: 2, position: "relative", animation: "pulseDot 2s infinite 1s" }} />
            <div className="text-motion-wrapper">
              <span className="text-item index-num" style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#90c8ff", opacity: 0.5 }}>03</span>
              <h3 className="text-item" style={{ fontSize: "1.2rem", fontWeight: 200, color: "#fff", margin: "1rem 0" }}>ZERO-KNOWLEDGE VERIFICATION</h3>
              <p className="text-item" style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.7, fontWeight: 300 }}>Prove identity without exposing raw data — portable across AI and onchain worlds.</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}