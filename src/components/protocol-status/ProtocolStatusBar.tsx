"use client";
import { useState, useEffect } from "react";

interface NetworkStats {
  total_nodes: number;
  genesis_nodes: number;
  active_humans: number;
  agents: number;
  total_scans: number;
  genesis_remaining: number;
}

/** Compact protocol telemetry — fixed bottom-left, single-letter prefixes, color-coded. */
export default function ProtocolStatusBar() {
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [live, setLive] = useState(true);
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      const start = performance.now();
      try {
        const res = await fetch("/api/nodes/status");
        const elapsed = Math.round(performance.now() - start);
        if (cancelled) return;
        setLatency(elapsed);
        if (!res.ok) throw new Error("down");
        const data = await res.json();
        setStats({
          total_nodes: data.total_nodes ?? 0,
          genesis_nodes: data.genesis_nodes ?? 0,
          active_humans: data.active_humans ?? 0,
          agents: data.agents ?? 0,
          total_scans: data.total_scans ?? 0,
          genesis_remaining: data.genesis_remaining ?? 100,
        });
        setLive(true);
      } catch {
        if (!cancelled) setLive(false);
      }
    }
    poll();
    const id = setInterval(poll, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const compact = stats
    ? (live ? "◉" : "○") +
      ` N${stats.total_nodes}` +
      ` H${stats.active_humans}` +
      ` A${stats.agents}` +
      ` S${stats.total_scans}` +
      ` G${stats.genesis_nodes}/100` +
      (latency !== null ? ` ${latency}ms` : "")
    : live
      ? "◉ —"
      : "○ offline";

  return (
    <div
      className="fixed bottom-3 left-3 z-[998] font-mono text-[9px] tracking-[0.06em] select-none"
      style={{ lineHeight: 1 }}
    >
      <span
        style={{
          display: "inline-block",
          background: "rgba(2,4,10,0.8)",
          border: "1px solid rgba(144,200,255,0.1)",
          borderRadius: 4,
          padding: "3px 8px",
          backdropFilter: "blur(6px)",
          color: "rgba(255,255,255,0.35)",
          whiteSpace: "nowrap",
        }}
      >
        {!stats ? (
          <span style={{ color: live ? "rgba(144,200,255,0.4)" : "rgba(248,81,73,0.5)" }}>
            {compact}
          </span>
        ) : (
          <>
            {/* Live dot */}
            <span
              style={{
                color: live ? "#3fb950" : "#f85149",
                marginRight: 2,
              }}
            >
              ◉
            </span>

            {/* Nodes */}
            <span>
              N<span style={{ color: "rgba(144,200,255,0.7)" }}>{stats.total_nodes}</span>
            </span>
            <span style={{ color: "rgba(255,255,255,0.1)", margin: "0 3px" }}>·</span>

            {/* Humans */}
            <span>
              H<span style={{ color: stats.active_humans > 0 ? "rgba(74,222,128,0.65)" : "rgba(255,255,255,0.2)" }}>{stats.active_humans}</span>
            </span>
            <span style={{ color: "rgba(255,255,255,0.1)", margin: "0 3px" }}>·</span>

            {/* Agents */}
            <span>
              A<span style={{ color: stats.agents > 0 ? "rgba(167,139,250,0.65)" : "rgba(255,255,255,0.2)" }}>{stats.agents}</span>
            </span>
            <span style={{ color: "rgba(255,255,255,0.1)", margin: "0 3px" }}>·</span>

            {/* Scans */}
            <span>
              S<span style={{ color: stats.total_scans > 0 ? "rgba(251,191,36,0.65)" : "rgba(255,255,255,0.2)" }}>{stats.total_scans}</span>
            </span>
            <span style={{ color: "rgba(255,255,255,0.1)", margin: "0 3px" }}>·</span>

            {/* Genesis */}
            <span>
              G<span style={{ color: stats.genesis_remaining <= 10 ? "rgba(210,153,29,0.75)" : "rgba(144,200,255,0.6)" }}>{stats.genesis_nodes}/100</span>
              {stats.genesis_remaining <= 10 && stats.genesis_remaining > 0 && (
                <span style={{ color: "rgba(210,153,29,0.4)", marginLeft: 1 }}>‑{stats.genesis_remaining}</span>
              )}
            </span>

            {/* Ping */}
            {latency !== null && (
              <>
                <span style={{ color: "rgba(255,255,255,0.1)", margin: "0 3px" }}>·</span>
                <span
                  style={{
                    color:
                      latency < 150 ? "rgba(74,222,128,0.55)" :
                      latency < 400 ? "rgba(251,191,36,0.55)" :
                      "rgba(248,81,73,0.55)",
                  }}
                >
                  {latency}ms
                </span>
              </>
            )}
          </>
        )}
      </span>
    </div>
  );
}
