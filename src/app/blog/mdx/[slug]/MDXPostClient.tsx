"use client";

import Link from "next/link";
import ProtocolHeader from "@/components/header/header";
import ProtocolFooter from "@/components/footer/footer";
import BackgroundParticles from "@/components/particles/BackgroundParticles";
import PostNavigation from "@/components/blog/PostNavigation";
import { playTick } from "@/utils/useAudioTick";
import "@/app/blog/blog.css";
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle: string;
  date: string;
  series?: string;
  content: ReactNode;
  slug: string;
}

export default function MDXPostClient({ title, subtitle, date, series, content, slug }: Props) {
  return (
    <div className="bg-[#02040a] text-[#f8feff] font-mono selection:bg-[#90c8ff]/30 min-h-screen flex flex-col">
      <ProtocolHeader />
      <main className="flex-1 relative">
        <BackgroundParticles />
        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6" style={{ paddingTop: "8rem", paddingBottom: "6rem" }}>
          {/* Header */}
          <div className="space-y-4 mb-16">
            <div className="flex items-center gap-4 text-[#90c8ff]/50 text-[10px] tracking-[0.3em] uppercase">
              {series && <span>{series}</span>}
              {series && <span className="w-8 h-[1px] bg-[#90c8ff]/20" />}
              <span>{date}</span>
              <span className="w-8 h-[1px] bg-[#90c8ff]/20" />
              <span className="text-white/40">The Continuity Lab</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-light tracking-[0.08em] text-white leading-tight" onMouseEnter={() => playTick(520, "sine", 0.04, 0.015)}>
              {title}
            </h1>
            <p className="text-white/40 text-[14px] tracking-[0.06em] leading-[1.7] max-w-xl">
              {subtitle}
            </p>
          </div>

          {/* Content */}
          <div className="text-white/55 text-[15px] sm:text-[17px] leading-[1.85] tracking-[0.03em] space-y-5">
            {content}
          </div>

          <PostNavigation slug={`/blog/mdx/${slug}`} />

          {/* Back link */}
          <div className="mt-12 text-center">
            <Link href="/blog" className="blog-back-link" onMouseEnter={() => playTick(400, "sine", 0.03, 0.018)}>← Protocol Log</Link>
          </div>
        </div>
      </main>
      <ProtocolFooter />
    </div>
  );
}
