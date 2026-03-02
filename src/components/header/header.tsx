"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const ProtocolHeader = () => {
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setUtcTime(now.getUTCHours().toString().padStart(2, '0') + ":" + 
                  now.getUTCMinutes().toString().padStart(2, '0') + ":" + 
                  now.getUTCSeconds().toString().padStart(2, '0') + " UTC");
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <nav style={styles.headerNav}>
      <div style={styles.gradientOverlay} />

      {/* 左侧：系统状态 */}
      <div style={styles.leftSection}>
        <div className="status-pulse" />
        <span style={styles.versionText} className="hide-mobile">MYSHAPE_CORE_V1.92</span>
        <span style={styles.divider} className="hide-mobile">//</span>
        <span style={styles.statusText}>E&C: ACTIVE</span>
      </div>

      {/* 中间：Logo - 点击返回首页 */}
      <Link href="/" style={styles.centerSection} className="brand-logo-link">
        M Y S H A P E
      </Link>

      {/* 右侧：时间、节点与钱包 */}
      <div style={styles.rightSection}>
        <span style={styles.timeDisplay} className="hide-mobile">{utcTime}</span>
        
        {/* 🔹 关键修改：将节点标识作为通往 /protocol 的入口 🔹 */}
        <Link href="/protocol" style={{ textDecoration: 'none' }}>
          <div style={styles.nodeBadge} className="node-link-hover">
            KFK_SPC_DC{new Date().getDate()} 
          </div>
        </Link>

        <button 
          onClick={() => console.log("Wallet connection triggered")}
          style={styles.walletBtn}
          className="wallet-btn-optimized"
        >
          <div className="scan-line" />
          <div className="status-pulse-green" />
          <span style={{ position: 'relative', zIndex: 1 }}>MYSHAE.BASE.ETH</span>
        </button>
      </div>

      <style jsx>{`
        @keyframes statusBlink {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 8px rgba(144, 200, 255, 0.6); }
          50% { opacity: 0.3; transform: scale(0.9); box-shadow: 0 0 2px rgba(144, 200, 255, 0.2); }
        }
        @keyframes greenBlink {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px rgba(80, 255, 170, 0.8); }
          50% { opacity: 0.4; box-shadow: 0 0 2px rgba(80, 255, 170, 0.2); }
        }
        @keyframes borderResonance {
          0%, 100% { border-color: rgba(144, 200, 255, 0.2); background: rgba(144, 200, 255, 0.05); }
          50% { border-color: rgba(144, 200, 255, 0.5); background: rgba(144, 200, 255, 0.08); }
        }
        @keyframes scan {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .status-pulse {
          width: 4px; height: 4px; background-color: #90c8ff; border-radius: 50%;
          animation: statusBlink 3s infinite ease-in-out;
        }
        .status-pulse-green {
          width: 4px; height: 4px; background-color: #50ffaa; border-radius: 50%;
          animation: greenBlink 2s infinite ease-in-out;
        }

        .brand-logo-link {
          text-decoration: none;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .brand-logo-link:hover {
          opacity: 1 !important;
          text-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
          transform: translateX(-50%) scale(1.05) !important;
          letter-spacing: 1.1em !important;
        }

        .wallet-btn-optimized {
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: borderResonance 4s infinite ease-in-out;
        }

        .scan-line {
          position: absolute;
          top: 0; width: 40%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(144, 200, 255, 0.1), transparent);
          animation: scan 3s infinite linear;
          pointer-events: none;
        }

        .wallet-btn-optimized:hover {
          border-color: #90c8ff !important;
          box-shadow: inset 0 0 10px rgba(144, 200, 255, 0.2), 0 0 15px rgba(144, 200, 255, 0.1);
          color: #fff !important;
          transform: translateY(-1px);
        }

        /* 新增：节点链接的交互感 */
        .node-link-hover {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        .node-link-hover:hover {
          background: rgba(144, 200, 255, 0.15) !important;
          border-color: rgba(144, 200, 255, 0.4) !important;
          color: #fff !important;
          opacity: 1 !important;
        }

        @media (max-width: 768px) {
          .hide-mobile { display: none; }
          .brand-logo-link { 
            letter-spacing: 0.4em !important; 
            font-size: 11px !important; 
            text-indent: 0.4em !important;
          }
          .brand-logo-link:hover {
            letter-spacing: 0.45em !important;
          }
        }
      `}</style>
    </nav>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  headerNav: {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '60px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px',
    background: 'linear-gradient(to bottom, rgba(2, 4, 10, 0.95) 0%, rgba(2, 4, 10, 0) 100%)',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    zIndex: 9999, fontFamily: 'monospace', color: '#90c8ff',
  },
  gradientOverlay: {
    position: 'absolute', bottom: 0, left: 0, width: '100%', height: '1px',
    background: 'linear-gradient(to right, transparent, rgba(144, 200, 255, 0.2), transparent)',
  },
  leftSection: { display: 'flex', alignItems: 'center', gap: '15px', fontSize: '9px', letterSpacing: '0.15em' },
  versionText: { fontWeight: 'bold', opacity: 0.8 },
  divider: { opacity: 0.2 },
  statusText: { opacity: 0.5 },
  centerSection: {
    position: 'absolute', left: '50%', transform: 'translateX(-50%)',
    color: '#fff', fontSize: '14px', letterSpacing: '1em', fontWeight: 300,
    whiteSpace: 'nowrap', textIndent: '1em', opacity: 0.9,
  },
  rightSection: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '9px' },
  timeDisplay: { opacity: 0.4, letterSpacing: '0.05em' },
  nodeBadge: {
    border: '1px solid rgba(144, 200, 255, 0.15)', padding: '3px 8px', fontSize: '8px',
    background: 'rgba(144, 200, 255, 0.02)', borderRadius: '2px', opacity: 0.6,
  },
  walletBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    border: '1px solid rgba(144, 200, 255, 0.2)',
    padding: '4px 12px', borderRadius: '2px', color: '#90c8ff',
    fontSize: '9px', cursor: 'pointer', fontFamily: 'monospace',
    letterSpacing: '0.1em', fontWeight: 'bold', outline: 'none', marginLeft: '5px',
  }
};

export default ProtocolHeader;