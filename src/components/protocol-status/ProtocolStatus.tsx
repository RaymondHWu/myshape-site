"use client";
import { useState, useEffect } from "react";
import { playTick } from "@/utils/useAudioTick";

interface Status {
  total_nodes: number;
  genesis_nodes: number;
  genesis_remaining: number;
  active_humans: number;
  agents: number;
  last_scan: string | null;
  cohort_sealed: boolean;
  status: string;
}

function StatGroup({ children }: { children: React.ReactNode }) {
  return (
    <div
      onMouseEnter={() => playTick(450, "sine", 0.04, 0.01)}
      className="flex items-center gap-2 px-2 py-1 transition-all duration-300 hover:bg-white/[0.02] rounded cursor-default group/stat"
    >
      {children}
    </div>
  );
}

export default function ProtocolStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const fetch = () => {
      window
        .fetch("/api/nodes/status")
        .then((r) => r.json())
        .then((data) => {
          if (data.status) {
            const prev = status?.total_nodes || 0;
            setStatus(data);
            if (data.total_nodes > prev) {
              setPulse(true);
              setTimeout(() => setPulse(false), 1500);
            }
          }
        })
        .catch(() => {});
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  return (
    <div className="w-full border-t border-white/[0.04] bg-transparent py-3">
      <div className="max-w-6xl mx-auto px-4 md:px-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[9px] tracking-[0.2em] uppercase font-mono">
        <StatGroup>
          <span className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${pulse ? "bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.8)]" : "bg-cyan-400/60 shadow-[0_0_4px_rgba(34,211,238,0.4)]"}`} />
          <span className="text-white/20 group-hover/stat:text-white/40 transition-colors">Protocol</span>
          <span className="text-cyan-400/60 group-hover/stat:text-cyan-300/90 transition-colors">{status.status}</span>
        </StatGroup>

        <span className="text-white/[0.06] hidden md:block">|</span>

        <StatGroup>
          <span className="text-white/15 group-hover/stat:text-white/35 transition-colors">Genesis</span>
          <span className="text-cyan-400/50 group-hover/stat:text-cyan-300/80 transition-colors">{status.genesis_nodes}</span>
          <span className="text-white/10 group-hover/stat:text-white/25 transition-colors">/100</span>
          {!status.cohort_sealed && (
            <span className="text-white/[0.08] group-hover/stat:text-white/20 transition-colors">
              — {status.genesis_remaining} open
            </span>
          )}
          {status.cohort_sealed && (
            <span className="text-cyan-400/30 text-[7px] tracking-[0.3em] group-hover/stat:text-cyan-300/60 transition-colors">SEALED</span>
          )}
        </StatGroup>

        <span className="text-white/[0.06] hidden md:block">|</span>

        <StatGroup>
          <span className="text-white/15 group-hover/stat:text-white/35 transition-colors">Nodes</span>
          <span className="text-cyan-400/50 group-hover/stat:text-cyan-300/80 transition-colors">{status.active_humans}</span>
          <span className="text-white/10 group-hover/stat:text-white/25 transition-colors">human</span>
          <span className="text-white/[0.06] group-hover/stat:text-white/15 transition-colors">+</span>
          <span className="text-cyan-400/30 group-hover/stat:text-cyan-300/60 transition-colors">{status.agents}</span>
          <span className="text-white/10 group-hover/stat:text-white/25 transition-colors">agent</span>
        </StatGroup>

        {status.last_scan && (
          <>
            <span className="text-white/[0.06] hidden md:block">|</span>
            <StatGroup>
              <span className="text-white/15 group-hover/stat:text-white/35 transition-colors">Last Scan</span>
              <span className="text-white/20 group-hover/stat:text-white/45 transition-colors">{status.last_scan}</span>
            </StatGroup>
          </>
        )}
      </div>
    </div>
  );
}
