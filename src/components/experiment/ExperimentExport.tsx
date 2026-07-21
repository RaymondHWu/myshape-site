"use client";

import { useState, useEffect } from "react";
import { getRunCount, getRunsByEngine, clearRuns } from "@/lib/experiment-logger";
import type { ExperimentRun } from "@/lib/experiment-logger";

interface Props {
  engineId: string;
}

function formatRun(r: ExperimentRun): string {
  const lines: string[] = [];
  const time = r.timestamp.slice(11, 19); // HH:MM:SS
  const pct = `${(r.confidence * 100).toFixed(0)}%`;
  const sim = r.isSimulated ? " [SIM]" : "";

  lines.push(`${r.engineId} · ${time}${sim} · ${r.verdict} · ${pct}`);

  for (const c of r.components) {
    const icon = c.status === "PASS" ? "✓" : c.status === "FAIL" ? "✗" : "—";
    lines.push(`  ${c.metric}: ${c.value.toFixed(3)}/${c.threshold} ${icon}`);
  }

  if (r.roundResults && r.roundResults.length > 0) {
    const rounds = r.roundResults.map((rr) => {
      const ok = rr.directionMatch && rr.magnitudeStatus === "PASS";
      return `R${rr.round}${rr.direction}${ok ? "✓" : "✗"}${rr.angleDeg}° ${rr.peakG}g`;
    });
    lines.push(`  ${rounds.join(" | ")}`);
  }

  if (r.decision) lines.push(`  decision: ${r.decision}`);
  if (r.passiveScore !== undefined) lines.push(`  passive: ${(r.passiveScore * 100).toFixed(0)}%`);
  if (r.imuCount !== undefined) lines.push(`  imu: ${r.imuCount} cam: ${r.camCount ?? "—"} matches: ${r.matchCount ?? "—"}`);

  for (const d of r.diagnostics) {
    lines.push(`  ${d}`);
  }

  return lines.join("\n");
}

export default function ExperimentExport({ engineId }: Props) {
  const [count, setCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setCount(getRunsByEngine(engineId).length);
  }, [engineId]);

  function handleCopy() {
    const runs = getRunsByEngine(engineId);
    if (runs.length === 0) return;
    const text = runs.map(formatRun).join("\n\n---\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  function handleClear() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearRuns();
    setCount(0);
    setCleared(true);
    setConfirmClear(false);
    setTimeout(() => setCleared(false), 2000);
  }

  const allRuns = getRunsByEngine(engineId);
  const passCount = allRuns.filter((r) => r.verdict === "PASS").length;

  return (
    <div className="p-3 border border-white/[0.04] bg-white/[0.01] space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white/25">📊</span>
          <span className="text-[11px] text-white/50 font-mono">
            {count} runs
            {passCount > 0 && count > 0 && (
              <span className="text-[#3fb950]/50 ml-1">({passCount} pass)</span>
            )}
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={handleCopy}
            disabled={count === 0}
            className="px-3 py-1.5 border border-[#90c8ff]/30 text-[11px] text-[#90c8ff]/60 tracking-[0.1em] uppercase hover:border-[#90c8ff]/60 hover:text-[#90c8ff]/90 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            {copied ? "✓ Copied!" : "📋 Copy All"}
          </button>
          {confirmClear ? (
            <>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 border border-[#f85149]/40 text-[11px] text-[#f85149]/60 tracking-[0.1em] uppercase hover:border-[#f85149] transition-all"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-3 py-1.5 border border-white/10 text-[11px] text-white/20 tracking-[0.1em] uppercase hover:border-white/25 transition-all"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={handleClear}
              disabled={count === 0}
              className="px-3 py-1.5 border border-white/10 text-[11px] text-white/15 tracking-[0.1em] uppercase hover:border-[#f85149]/30 hover:text-[#f85149]/50 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              {cleared ? "✓ Cleared" : "Clear"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
