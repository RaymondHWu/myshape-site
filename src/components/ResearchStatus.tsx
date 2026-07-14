"use client";

type Props = {
  engineId: string;
  title: string;
  stage?: string;
  lastUpdated?: string;
};

export default function ResearchStatus({ engineId, title, stage = "Evidence Collection", lastUpdated = "2026-07" }: Props) {
  return (
    <div
      className="mb-6 p-4 border border-[#d4af37]/15 bg-[#d4af37]/[0.02] text-[10px] tracking-[0.04em] leading-relaxed"
      style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-white/30">
        <span className="text-white/15 text-[9px] tracking-[0.2em] uppercase">Research Prototype</span>
        <span>
          Engine: <span className="text-[#d4af37]/50">{engineId}</span>
        </span>
        <span>
          Status: <span className="text-[#d4af37]/40">Prototype</span>
        </span>
        <span>
          Stage: <span className="text-white/25">{stage}</span>
        </span>
        <span>
          Updated: <span className="text-white/20">{lastUpdated}</span>
        </span>
      </div>
      <div className="mt-1.5 text-white/15 text-[9px]">
        {title}. Validated under controlled conditions. Not for production use.
      </div>
    </div>
  );
}
