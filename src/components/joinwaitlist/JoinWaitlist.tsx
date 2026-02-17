"use client";
import React, { useEffect, useRef, useState } from 'react';

export default function JoinWaitlist() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [isTyping, setIsTyping] = useState(false);
  const [errorHint, setErrorHint] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorHint("INVALID_PROTOCOL_FORMAT");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorHint("");

    try {
      const response = await fetch("https://formsubmit.co/ajax/e24852dbfcaeee1d6895450fa46367e7", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Accept": "application/json" 
        },
        body: JSON.stringify({
          email: email,
          _subject: "Genesis Protocol: New Node Connection",
          message: `Identity Established: ${email}`,
          _template: "table",
          _captcha: "false"
        })
      });

      if (response.ok) {
        setStatus("success");
      } else {
        throw new Error();
      }
    } catch (err) {
      setErrorHint("UPLINK_INTERRUPTED_RETRY");
      setStatus("error");
    }
  };

  // 粒子漩涡逻辑
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    
    const resize = () => { 
      canvas.width = window.innerWidth; 
      // 手机端高度根据视口动态调整，防止背景被拉伸过长
      canvas.height = window.innerWidth < 768 ? window.innerHeight * 0.7 : 800; 
    };
    
    class Particle {
      angle: number;
      radius: number;
      speed: number;
      size: number;

      constructor() {
        this.angle = Math.random() * Math.PI * 2;
        // 响应式半径：手机端缩小半径，让漩涡集中在正中
        const maxRadius = window.innerWidth < 768 ? window.innerWidth * 0.35 : 320;
        this.radius = Math.random() * maxRadius + 20;
        this.speed = 0.005 + Math.random() * 0.005;
        this.size = Math.random() * 1.5;
      }
      update(isBoosted: boolean) {
        const targetSpeed = isBoosted ? this.speed * 3.5 : this.speed;
        this.angle += targetSpeed;
      }
      draw() {
        if (!ctx || !canvas) return;
        const x = canvas.width / 2 + Math.cos(this.angle) * this.radius;
        const y = canvas.height / 2 + Math.sin(this.angle) * this.radius;
        ctx.fillStyle = isTyping || status === "submitting" ? 'rgba(144, 200, 255, 0.9)' : 'rgba(128, 191, 255, 0.4)';
        ctx.beginPath(); 
        ctx.arc(x, y, this.size, 0, Math.PI * 2); 
        ctx.fill();
      }
    }

    const init = () => { 
      resize(); 
      const particleCount = window.innerWidth < 768 ? 60 : 180;
      particles = Array.from({ length: particleCount }, () => new Particle()); 
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(isTyping || status === "submitting"); p.draw(); });
      animationFrameId = requestAnimationFrame(render);
    };

    init(); 
    render();
    window.addEventListener('resize', init);
    return () => { 
      cancelAnimationFrame(animationFrameId); 
      window.removeEventListener('resize', init); 
    };
  }, [isTyping, status]);

  return (
    <section className="waitlist-section" style={{ 
      padding: '100px 24px', 
      background: 'transparent', 
      position: 'relative', 
      overflow: 'hidden', 
      minHeight: '75vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      {/* 背景漩涡层 */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }} />

      <div style={{ maxWidth: '800px', width: '100%', position: 'relative', zIndex: 2, textAlign: 'center' }}>
        
        {/* 标题与滚动副标题 */}
        <div className="waitlist-header" style={{ marginBottom: "50px" }}>
          <h2 className="genesis-title" style={{ fontWeight: 200, color: '#f8feff', letterSpacing: '-0.02em', marginBottom: '1.2rem' }}>
             {status === "success" ? "Uplink Confirmed." : "Initialize Genesis."}
          </h2>
          <div style={{ overflow: 'hidden', display: 'inline-block' }}>
             <p className="typing-text" style={{ color: 'rgba(144, 200, 255, 0.7)', fontSize: '10px', letterSpacing: '0.4em', fontWeight: 300 }}>
               {status === "success" ? "IDENTITY_LAYER_INITIALIZED" : "ESTABLISHING_IDENTITY_LAYER_PROTOCOL"}
             </p>
          </div>
        </div>

        {status === "success" ? (
          <div style={{ animation: 'contentFadeIn 1s forwards', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '25px' }}>
            <div style={{ padding: '24px 30px', border: '1px solid rgba(144,200,255,0.3)', background: 'rgba(144,200,255,0.03)', backdropFilter: 'blur(15px)', position: 'relative', width: 'fit-content' }}>
               <div className="corner tl" /> <div className="corner tr" />
               <div className="corner bl" /> <div className="corner br" />
               
               <p style={{ color: '#fff', fontSize: '10px', letterSpacing: '0.2em', lineHeight: '2', margin: 0, fontWeight: 300, textAlign: 'left' }}>
                 NODE_STATUS: <span style={{ color: '#90c8ff' }}>ACTIVE</span> <br/>
                 ENCRYPTION: <span style={{ color: '#90c8ff' }}>RSA_4096_SYNC</span> <br/>
                 WAITLIST: <span style={{ color: '#90c8ff' }}>SEQUENTIAL_ENQUEUED</span>
               </p>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontStyle: 'italic', marginTop: '10px', letterSpacing: '0.1em' }}>
              "The motion has been captured."
            </p>
            <div className="pulse-dot" />
          </div>
        ) : (
          <form className="waitlist-form" onSubmit={handleSubmit} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '35px', width: '100%' }}>
            <div className={`input-portal ${isTyping ? 'active' : ''}`} style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
              <input
                type="email"
                required
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                onChange={(e) => { setEmail(e.target.value); if(status === "error") setStatus("idle"); }}
                value={email}
                placeholder="GENESIS_EMAIL@ADDRESS.IO"
                style={{
                  padding: '22px 15px', width: '100%', fontSize: '11px', letterSpacing: '0.15em',
                  textAlign: 'center', outline: 'none', color: '#fff',
                  background: 'rgba(255,255,255,0.02)', border: `1px solid ${status === "error" ? '#ff4d4d' : 'rgba(128, 191, 255, 0.3)'}`,
                  transition: 'all 0.5s ease', backdropFilter: 'blur(5px)', borderRadius: '0'
                }}
              />
              <div className="corner tl" /> <div className="corner tr" />
              <div className="corner bl" /> <div className="corner br" />
              
              {status === "error" && (
                <p style={{ position: 'absolute', bottom: '-28px', left: 0, width: '100%', color: '#ff4d4d', fontSize: '9px', letterSpacing: '0.1em' }}>
                  {errorHint}
                </p>
              )}
            </div>

            <button type="submit" disabled={status === "submitting"} className="genesis-btn">
              <div className="btn-glow-bar" />
              <span className="btn-text">
                {status === "submitting" ? "SYNCHRONIZING..." : "COMMENCE_CONNECTION"}
              </span>
              <span className="btn-hover-text">ACTIVATE_IDENTITY</span>
            </button>
          </form>
        )}
      </div>

      <style jsx>{`
        .genesis-title { font-size: 42px; }
        
        @media (max-width: 768px) {
          .waitlist-section { padding: 60px 20px !important; min-height: 60vh !important; }
          .genesis-title { font-size: 28px !important; }
          .waitlist-header { marginBottom: 35px !important; }
          .genesis-btn { padding: 16px 30px !important; width: 100%; max-width: 400px; font-size: 9px !important; }
          .typing-text { font-size: 9px !important; }
        }

        .typing-text {
          display: inline-block; border-right: 2px solid #90c8ff;
          white-space: nowrap; overflow: hidden;
          animation: typing 3.5s steps(40, end), blink-caret .75s step-end infinite;
        }
        @keyframes typing { from { width: 0 } to { width: 100% } }
        @keyframes blink-caret { from, to { border-color: transparent } 50% { border-color: #90c8ff } }

        .genesis-btn {
          padding: 20px 80px; letter-spacing: 0.4em; font-size: 10px;
          cursor: pointer; border: 1px solid #80bfff; background: transparent;
          color: #80bfff; transition: all 0.6s; position: relative; overflow: hidden;
        }
        .btn-glow-bar {
          position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(144, 200, 255, 0.2), transparent);
          animation: scan 4s infinite linear;
        }
        @keyframes scan { 100% { left: 100%; } }

        .genesis-btn:hover { background: #90c8ff; color: #02040a !important; box-shadow: 0 0 30px rgba(144, 200, 255, 0.3); }
        .btn-hover-text { position: absolute; left: 50%; top: 180%; transform: translate(-50%, -50%); width: 100%; transition: all 0.5s; font-weight: bold; }
        .genesis-btn:hover .btn-text { transform: translateY(-350%); opacity: 0; }
        .genesis-btn:hover .btn-hover-text { top: 50%; }

        .corner { position: absolute; width: 12px; height: 12px; border-color: rgba(144, 200, 255, 0.4); border-style: solid; transition: 0.4s; }
        .tl { top: -8px; left: -8px; border-width: 2px 0 0 2px; }
        .tr { top: -8px; right: -8px; border-width: 2px 2px 0 0; }
        .bl { bottom: -8px; left: -8px; border-width: 0 0 2px 2px; }
        .br { bottom: -8px; right: -8px; border-width: 0 2px 2px 0; }
        .input-portal.active .corner { border-color: #90c8ff; width: 18px; height: 18px; }
        
        @keyframes contentFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .pulse-dot {
          width: 4px; height: 4px; background: #80bfff; border-radius: 50%;
          box-shadow: 0 0 15px #80bfff; animation: pulse 3s infinite ease-in-out;
        }
        @keyframes pulse { 0%, 100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 1; transform: scale(1.5); } }
      `}</style>
    </section>
  );
}