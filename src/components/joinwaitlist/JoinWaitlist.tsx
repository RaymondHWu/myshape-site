"use client";
import React, { useEffect, useRef, useState } from "react";

export default function JoinWaitlist({ id }: { id?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const collapseStartRef = useRef(0);
  const isHoveringRef = useRef(false);
  const isCollapsingRef = useRef(false);
  const currentSpeedRef = useRef(1);
  isHoveringRef.current = isHovering;
  isCollapsingRef.current = isCollapsing;

  const handleEstablishConnection = () => {
    if (isCollapsing) return;
    setIsCollapsing(true);
    collapseStartRef.current = Date.now();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("protocol:open-wallet"));
      setIsCollapsing(false);
    }, 1000);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animationFrameId: number;
    let particles: any[] = [];

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = 800;
      const count = window.innerWidth < 768 ? 80 : 220;
      particles = Array.from({ length: count }, () => {
        const radius = 20 + Math.random() * (window.innerWidth < 768 ? 250 : 380);
        const speedGradient = 1 / (radius / 300 + 0.25);
        return {
          angle: Math.random() * Math.PI * 2,
          radius,
          baseRadius: radius,
          speed: (0.0035 + Math.random() * 0.001) * speedGradient,
          size: 0.5 + Math.random() * 1.5,
          y: (Math.random() - 0.5) * 80,
        };
      });
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);

      const isColl = isCollapsingRef.current;
      const isHov = isHoveringRef.current;
      const collapseElapsed = isColl ? (Date.now() - collapseStartRef.current) / 1000 : 0;
      const collapseT = Math.min(collapseElapsed, 1);

      const targetSpeed = isHov ? 2.5 : 1;
      currentSpeedRef.current += (targetSpeed - currentSpeedRef.current) * 0.04;
      const speedMult = currentSpeedRef.current;

      ctx.globalCompositeOperation = 'lighter';

      particles.forEach((p) => {
        if (isColl) {
          p.radius *= 0.85 + 0.1 * collapseT;
          p.angle += p.speed * 10;
          p.radius += (p.baseRadius - p.radius) * 0.02;
        } else {
          p.angle += p.speed * speedMult;
          p.radius += (p.baseRadius - p.radius) * 0.008;
        }

        const x = Math.cos(p.angle) * p.radius;
        const y = Math.sin(p.angle) * p.radius;

        const size = isColl ? Math.max(0.1, p.size * (p.radius / Math.max(1, p.baseRadius))) : p.size;
        const starSize = size * 0.7;

        const alpha = isColl
          ? Math.min(p.radius / Math.max(1, p.baseRadius), 1) * 0.5
          : 0.12 + 0.25 * (1 - p.radius / 500);

        ctx.shadowColor = '#00f2ff';
        ctx.shadowBlur = 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(alpha * 2.5, 1)})`;
        ctx.beginPath();
        ctx.arc(x, y, starSize * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    init();
    render();
    window.addEventListener("resize", init);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", init);
    };
  }, []);

  return (
    <section
      id={id}
      ref={sectionRef}
      className="waitlist-section"
      style={{
        padding: "100px 24px",
        position: "relative",
        overflow: "hidden",
        minHeight: "80vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      <div
        style={{
          maxWidth: "800px",
          width: "100%",
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          opacity: isCollapsing ? 0 : 1,
          transition: "opacity 0.8s ease",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            marginBottom: "50px",
          }}
        >
          <h2
            style={{
              fontWeight: 200,
              color: "#f8feff",
              letterSpacing: "-0.02em",
              marginBottom: "1.2rem",
              fontSize: "3.2rem",
            }}
          >
            Initialize Genesis.
          </h2>
          <div className="typing-container">
            <p className="typing-text">ESTABLISHING_IDENTITY_LAYER_PROTOCOL</p>
          </div>
        </div>

        <div style={{ pointerEvents: "auto", display: "inline-block" }}>
          <button
            onClick={handleEstablishConnection}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className="establish-connection group"
          >
            <span className="btn-border" />
            <span className="btn-streak" />
            <span className="btn-text">[ ESTABLISH _ CONNECTION ]</span>
          </button>
        </div>
      </div>

      <style>{`
        .typing-container {
          display: inline-block;
          position: relative;
        }
        .typing-text {
          color: rgba(144, 200, 255, 0.7);
          font-size: 10px;
          letter-spacing: 0.6em;
          font-weight: 300;
          text-transform: uppercase;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          border-right: 2px solid #90c8ff;
          width: 0;
          animation: typing 3.5s steps(40) infinite,
            blink-cursor 0.75s step-end infinite;
        }
        @keyframes typing {
          0% { width: 0; }
          70% { width: 100%; }
          90% { width: 100%; }
          100% { width: 0; }
        }
        @keyframes blink-cursor {
          from, to { border-color: transparent; }
          50% { border-color: #90c8ff; }
        }

        .establish-connection {
          position: relative;
          display: inline-block;
          padding: 22px 60px;
          background: transparent;
          border: none;
          cursor: pointer;
          overflow: hidden;
          pointer-events: auto;
        }
        .establish-connection .btn-border {
          position: absolute;
          inset: 0;
          border: 1px solid rgba(128, 191, 255, 0.5);
          transition: all 0.6s cubic-bezier(0.2, 1, 0.3, 1);
          pointer-events: none;
        }
        .establish-connection .btn-text {
          position: relative;
          z-index: 2;
          font-family: monospace;
          font-size: 10px;
          letter-spacing: 0.4em;
          font-weight: 300;
          text-transform: uppercase;
          color: rgba(128, 191, 255, 0.8);
          transition: all 0.6s ease;
          white-space: nowrap;
        }

        .establish-connection:hover .btn-border {
          border-color: rgba(0, 242, 255, 0.8);
          box-shadow: 0 0 30px rgba(0, 242, 255, 0.15),
                      inset 0 0 30px rgba(0, 242, 255, 0.05);
        }
        .establish-connection:hover .btn-text {
          color: #ffffff;
          text-shadow: 0 0 20px rgba(0, 242, 255, 0.4);
        }

        .btn-streak {
          position: absolute;
          top: 0;
          bottom: 0;
          left: -300px;
          width: 300px;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(0, 242, 255, 0.02) 20%,
            rgba(0, 242, 255, 0.15) 50%,
            rgba(0, 242, 255, 0.02) 80%,
            transparent 100%
          );
          mix-blend-mode: screen;
          opacity: 0.6;
          animation: streakScroll 6s ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
        }
        .establish-connection:hover .btn-streak {
          opacity: 1;
        }
        @keyframes streakScroll {
          0%   { transform: translateX(0); opacity: 0; }
          33%  { transform: translateX(0); opacity: 0; }
          35%  { transform: translateX(0); opacity: 0.6; }
          100% { transform: translateX(750px); opacity: 0.6; }
        }
      `}</style>
    </section>
  );
}
