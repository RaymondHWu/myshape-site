"use client";
import React from "react";

export default function NarrativeText({ lines, visible, side }: { lines: string[]; visible: boolean; side: "left" | "right"; }) {
  return (
    <div className={`absolute top-1/2 -translate-y-1/2 z-40 text-[12px] leading-relaxed tracking-[0.28em] font-light uppercase pointer-events-none transition-opacity duration-700 ${visible ? "opacity-100" : "opacity-0"} ${side === "left" ? "left-[14vw] text-left" : "right-[14vw] text-right"}`} style={{ color: "rgba(144,200,255,0.50)", textShadow: "0 0 8px rgba(144,200,255,0.15)" }}>
      {lines.map((line, i) => (
        <div key={i} className="relative overflow-hidden" style={{ height: "2.2em", display: "flex", alignItems: "center", justifyContent: side === "left" ? "flex-start" : "flex-end" }}>
          <div className="relative animate-[float_6s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.15}s` }}>
            {line.split("").map((char, j) => (
              <span key={j} className="relative inline-block opacity-0" style={{ visibility: "visible", animationName: visible ? "flash" : "none", animationDuration: "0.4s", animationTimingFunction: "ease-out", animationFillMode: "forwards", animationDelay: `${i * 0.25 + j * 0.03}s` }}>
                <span className="absolute inset-0 text-[rgba(255,80,80,0.12)] blur-[0.6px] pointer-events-none">{char === " " ? "\u00A0" : char}</span>
                <span className="absolute inset-0 text-[rgba(80,160,255,0.12)] blur-[0.6px] pointer-events-none">{char === " " ? "\u00A0" : char}</span>
                <span className="relative">{char === " " ? "\u00A0" : char}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}