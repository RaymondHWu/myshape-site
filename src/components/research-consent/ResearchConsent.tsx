"use client";

import { useState, useCallback } from "react";
import type { LightingCondition } from "@/types/research";
import type { UploadState } from "@/hooks/useResearchUpload";

interface ResearchConsentProps {
  consented: boolean;
  onConsentChange: (consented: boolean) => void;
  lighting: LightingCondition;
  onLightingChange: (lighting: LightingCondition) => void;
  uploadState: UploadState;
  uploadError: string | null;
  sessionId?: string;
  captureActive: boolean;
  uploadDone: boolean;
}

const LIGHTING_OPTIONS: { value: LightingCondition; label: string; desc: string }[] = [
  { value: "indoor_day", label: "Indoor — Day", desc: "Natural light through windows" },
  { value: "indoor_night", label: "Indoor — Night", desc: "Artificial room lighting" },
  { value: "outdoor_day", label: "Outdoor — Day", desc: "Direct or overcast daylight" },
  { value: "outdoor_night", label: "Outdoor — Night", desc: "Streetlights or low ambient light" },
];

export default function ResearchConsent({
  consented, onConsentChange, lighting, onLightingChange,
  uploadState, uploadError, sessionId, captureActive, uploadDone,
}: ResearchConsentProps) {
  const [expanded, setExpanded] = useState(false);

  const handleCheckbox = useCallback(() => {
    if (captureActive) return;
    const next = !consented;
    onConsentChange(next);
    if (next) setExpanded(true);
  }, [consented, captureActive, onConsentChange]);

  return (
    <div
      className="border-2 bg-black/50 transition-all duration-500"
      style={{
        borderRadius: 4,
        borderColor: consented ? "rgba(34,211,238,0.5)" : "rgba(34,211,238,0.3)",
        boxShadow: consented
          ? "0 0 18px rgba(34,211,238,0.12)"
          : "0 0 10px rgba(34,211,238,0.08), inset 0 0 10px rgba(34,211,238,0.02)",
        animation: consented ? "none" : "genesisWitnessGlow 3s ease-in-out infinite",
      }}
    >
      <button
        type="button" onClick={handleCheckbox} disabled={captureActive}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.04] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ borderRadius: 4 }}
      >
        {/* Large checkbox */}
        <div
          className="w-6 h-6 flex items-center justify-center border-2 transition-all shrink-0"
          style={{
            borderRadius: 3,
            borderColor: consented ? "rgba(34,211,238,0.7)" : "rgba(255,255,255,0.35)",
            background: consented ? "rgba(34,211,238,0.18)" : "rgba(255,255,255,0.03)",
            boxShadow: consented ? "0 0 14px rgba(34,211,238,0.3)" : "none",
          }}
        >
          {consented && (
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
              <path d="M1.5 5L5 8.5L12.5 1.5" stroke="rgba(34,211,238,1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        {/* Bright text */}
        <div className="flex-1 min-w-0">
          <div className="text-white/90 text-[14px] tracking-[0.06em] font-mono leading-tight">
            Contribute to Anonymous Research
          </div>
          <div className="text-cyan-400/60 text-[11px] tracking-[0.04em] mt-0.5 font-mono">
            Help calibrate the motion-signature engine
          </div>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && consented && (
        <div className="px-5 pb-4 space-y-3 border-t border-cyan-400/10 pt-3">
          <div className="flex items-start gap-2">
            <svg className="w-3 h-3 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="rgba(34,211,238,0.5)" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/>
            </svg>
            <p className="text-white/35 text-[10px] leading-relaxed tracking-[0.03em]">
              Only joint-position data (18-point wireframe). No camera images, no face data.
            </p>
          </div>

          {/* Lighting */}
          <div className="space-y-1.5">
            <div className="text-white/20 text-[8px] tracking-[0.15em] uppercase font-mono">Lighting</div>
            <div className="grid grid-cols-2 gap-1">
              {LIGHTING_OPTIONS.map((opt) => (
                <button key={opt.value} type="button" disabled={captureActive}
                  onClick={() => onLightingChange(opt.value)}
                  className="text-left px-2 py-1.5 border transition-all disabled:opacity-40"
                  style={{
                    borderRadius: 2,
                    borderColor: lighting === opt.value ? "rgba(34,211,238,0.4)" : "rgba(255,255,255,0.06)",
                    background: lighting === opt.value ? "rgba(34,211,238,0.06)" : "transparent",
                  }}>
                  <div className="text-[9px] tracking-[0.04em]" style={{ color: lighting === opt.value ? "rgba(34,211,238,0.8)" : "rgba(255,255,255,0.35)" }}>
                    {opt.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Upload status */}
          {uploadDone && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 border border-cyan-400/20 bg-cyan-400/[0.04] rounded-sm">
              <svg className="w-3 h-3 shrink-0" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4" stroke="rgba(34,211,238,0.6)" strokeWidth="1"/>
                <path d="M3 5l1.5 1.5L7 4" stroke="rgba(34,211,238,0.9)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-cyan-300/70 text-[9px] tracking-[0.06em] font-mono">Contribution recorded — thank you.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
