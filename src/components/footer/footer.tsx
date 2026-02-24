"use client";
import React from "react";
import Link from "next/link"; // 导入 Next.js 的 Link 组件以实现无刷新跳转

export default function ProtocolFooter() {
  const navGroups = [
    { 
      title: "PROTOCOL_CORE", 
      links: [
        { name: "OVERVIEW", href: "/overview" }, // 已激活：指向 src/app/overview/page.tsx
        { name: "IDENTITY_LAYER", href: "/identity-layer" },
        { name: "MOTION_PIPELINE", href: "/motion-pipeline" },
        { name: "ZERO_KNOWLEDGE", href: "/zk" }
      ] 
    },
    { 
      title: "CIV_LAYER", 
      links: [
        { name: "GENESIS", href: "/genesis" },
        { name: "VISION", href: "/vision" },
        { name: "PAPERS", href: "/papers" },
        { name: "PUBLICATION", href: "/publication" }
      ] 
    },
    { 
      title: "SYS_COMPANY", 
      links: [
        { name: "ABOUT_MYSHAPE", href: "/about-myshape" },
        { name: "ROADMAP", href: "/roadmap" },
        { name: "CONTACT", href: "/contact" }
      ] 
    },
    { 
      title: "CONNECT_NODES", 
      links: [
        { name: "X_PROTOCOL", href: "https://x.com" },
        { name: "LINKEDIN", href: "#" },
        { name: "DISCORD", href: "#" },
        { name: "GITHUB", href: "#" }
      ] 
    }
  ];

  return (
    <footer className="relative z-10 w-full bg-transparent font-mono pt-32 pb-20">
      {/* 1. 导航矩阵：视觉中心对齐 */}
      <div className="max-w-6xl mx-auto px-10 grid grid-cols-2 md:grid-cols-4 gap-y-16 gap-x-12">
        {navGroups.map((group) => (
          <div key={group.title} className="flex justify-center"> 
            {/* 每一列内部保持左对齐 */}
            <div className="flex flex-col items-start min-w-[160px]">
              {/* 模块标题 */}
              <div className="mb-8 group cursor-default">
                <h4 className="text-white text-[11px] font-bold tracking-[0.4em] mb-2 opacity-90">
                  {group.title}
                </h4>
                {/* 装饰短线 */}
                <div className="w-4 h-[1px] bg-cyan-500/50 group-hover:w-10 transition-all duration-700 ease-in-out" />
              </div>

              {/* 模块内链接 */}
              {group.links.map((link) => {
                const isExternal = link.href.startsWith('http');
                
                // 内部链接使用 Link 组件，外部链接使用 a 标签
                return isExternal ? (
                  <a 
                    key={link.name} 
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/30 text-[9px] mb-5 hover:text-cyan-400 hover:translate-x-1 transition-all duration-300 tracking-[0.25em]"
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    className="text-white/30 text-[9px] mb-5 hover:text-cyan-400 hover:translate-x-1 transition-all duration-300 tracking-[0.25em]"
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 2. 底部基座声明 */}
      <div className="max-w-6xl mx-auto px-10 border-t border-white/5 pt-12 mt-28">
        <div className="flex flex-col gap-3">
          {/* 系统状态行 */}
          <div className="flex items-center gap-3 text-cyan-500/60 text-[8px] tracking-[0.3em]">
            <span className="opacity-80">SYS_ID: MS_PROT_2026</span>
            <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_cyan]" />
            <span className="opacity-80">SECURITY: RSA-4096_ENCRYPTED</span>
          </div>
          
          {/* 协议声明文字 */}
          <p className="text-[7px] text-white/20 tracking-[0.2em] leading-relaxed max-w-sm">
            THE MOTION PROTOCOL IS A ZERO-KNOWLEDGE NEURAL LAYER. <br />
            ALL DATA SECURED VIA ON-CHAIN ENCRYPTION. DEPLOYED ON BASE NETWORK 🔵
          </p>

          {/* 底部版权 */}
          <div className="flex justify-between items-center mt-4">
            <p className="text-[6px] text-white/10 tracking-[0.1em]">
              © 2026 MYSHAPE LABS. ALL RIGHTS RESERVED.
            </p>
            <div className="text-[6px] text-white/5 tracking-[0.2em]">
              V1.0.4_STABLE_BUILD
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}