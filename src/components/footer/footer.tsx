"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function ProtocolFooter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("IDLE");
  const [cursorVisible, setCursorVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible((v) => !v), 600);
    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("SENDING");
    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (response.ok) {
        setStatus("SUCCESS");
        setEmail("");
        setTimeout(() => setStatus("IDLE"), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Subscription error:", errorData);
        setStatus("ERROR");
        setTimeout(() => setStatus("IDLE"), 3000);
      }
    } catch (error) {
      console.error("Network error during subscription:", error);
      setStatus("ERROR");
      setTimeout(() => setStatus("IDLE"), 3000);
    }
  };

  // 注意：這裡的所有鏈接必須使用 href 鍵名
  const navGroups = [
    { 
      title: "PROTOCOL_CORE", 
      links: [
        { name: "PROTOCOL_INDEX", href: "/protocol" }, 
        { name: "IDENTITY_LAYER", href: "/protocol/identity-layer" },
        { name: "MOTION_PIPELINE", href: "/protocol/motion-pipeline" },
        { name: "ZERO_KNOWLEDGE", href: "/protocol/zk" }
      ] 
    },
    { 
      title: "CIV_LAYER", 
      links: [
        { name: "GENESIS_ORIGIN", href: "/civ-layer/genesis" }, 
        { name: "VISION_ARCHIVE", href: "/civ-layer/vision" },
        { name: "TECHNICAL_PAPERS", href: "/civ-layer/papers" },
        { name: "PUBLICATION_HALL", href: "/civ-layer/publication" }
      ] 
    },
    { 
      title: "SYS_COMPANY", 
      links: [
        { name: "ABOUT_MYSHAPE", href: "/about-myshape" },
        { name: "ROADMAP_PLAN", href: "/roadmap" },
        { name: "CONTACT_SYSTEM", href: "/contact" }
      ] 
    },
    { 
      title: "CONNECT_NODES", 
      links: [
		{ name: "X_PROTOCOL", href: "https://x.com" },
		{ name: "LINKED_IN", href: "#" },
      ] 
    }
  ];

  return (
    <footer className="relative z-10 w-full bg-transparent font-mono pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-10 grid grid-cols-2 md:grid-cols-4 gap-y-16 gap-x-12">
        {navGroups.map((group) => (
          <div key={group.title} className="flex justify-start md:justify-center"> 
            <div className="flex flex-col items-start min-w-[160px]">
              <div className="mb-8 group cursor-default">
                <h4 className="text-white text-[11px] font-bold tracking-[0.4em] mb-2 opacity-90 uppercase group-hover:text-cyan-400 transition-colors">
                  {group.title}
                </h4>
                <div className="w-4 h-[1px] bg-cyan-500/50 group-hover:w-10 transition-all duration-700 ease-in-out shadow-[0_0_8px_#22d3ee]" />
              </div>

              {group.links.map((link) => {
                // 防禦性處理：如果 href 不存在，跳退到 "#" 避免報錯
                const safeHref = link.href || "#";
                const isExternal = safeHref.startsWith('http');
                const linkClass = "text-white/30 text-[9px] mb-5 hover:text-cyan-400 hover:translate-x-1 transition-all duration-300 tracking-[0.25em] uppercase block";
                
                return isExternal ? (
                  <a key={link.name} href={safeHref} target="_blank" rel="noopener noreferrer" className={linkClass}>{link.name}</a>
                ) : (
                  <Link key={link.name} href={safeHref} className={linkClass}>{link.name}</Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 2. 狀態條 & 訂閱區 */}
      <div className="max-w-6xl mx-auto px-10 border-t border-white/5 pt-12 mt-28">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-cyan-500/80 text-[9px] tracking-[0.3em] uppercase font-bold">
              <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_#22d3ee]" />
              <span>SYS_ID: MS_PROT_2026</span>
              <span className="text-white/20">|</span>
              <span>SECURED: RSA_4096</span>
            </div>
            <p className="text-[8px] text-white/40 tracking-[0.2em] leading-relaxed max-w-sm uppercase">
              DECENTRALIZED MOTION PROTOCOL LAYER. <br />
              ENCRYPTED DATA TRANSMISSION ACTIVE.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end">
            <div className="flex items-center gap-2 mb-4">
               <span className="text-[9px] text-white/40 tracking-[0.4em] uppercase font-bold">
                {status === "SUCCESS" ? "✓ UPLINK_ESTABLISHED" : "SIGNAL_SUBSCRIPTION"}
              </span>
            </div>
            <form onSubmit={handleSubscribe} className="relative w-full max-w-[320px] group">
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={status === "SENDING" ? "TRANSMITTING..." : `ENTER_EMAIL_ADDR${cursorVisible ? '█' : ' '}`}
                disabled={status !== "IDLE"}
                className="w-full bg-transparent border-b border-white/10 py-3 text-[10px] text-cyan-400/60 placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 transition-all tracking-[0.2em] uppercase font-mono"
                required
              />
              <button 
                type="submit"
                className="absolute right-0 bottom-3 text-[9px] font-normal text-cyan-500/25 hover:text-cyan-400/60 transition-all tracking-[0.2em]"
              >
                {status === "IDLE" && "[ CONNECT ]"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </footer>
  );
}
