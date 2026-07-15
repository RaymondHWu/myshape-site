"use client";

type Props = {
  engineId: string;
};

export default function ResearchStatus({ engineId }: Props) {
  return (
    <div className="text-center text-white/25 text-[9px] tracking-[0.15em]">
      Research Prototype · {engineId} · Not for production
    </div>
  );
}
