"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  type EngineEvidence,
  type Verdict,
  hashEvidence,
  evaluatePolicy,
} from "@/lib/evidence/types";
import {
  type IMUSample,
  type CameraSample,
  detectJerkPeaks,
  detectDirectionChanges,
  matchEvents,
  buildEvidence,
} from "@/lib/evidence/causal-coupling";

const DURATION = 8;
const CANVAS_W = 320;
const CANVAS_H = 240;

function round(v: number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return Math.round(v * 1000) / 1000;
}
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// Simple frame-differencing motion tracker (no MediaPipe needed)
function trackMotion(
  prevCtx: CanvasRenderingContext2D | null,
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  camSamples: CameraSample[],
  startTime: number,
) {
  try {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    if (video.readyState < 2) return prevCtx; // video not playing yet
    ctx.drawImage(video, 0, 0, CANVAS_W, CANVAS_H);

    if (prevCtx) {
      const curData = ctx.getImageData(0, 0, CANVAS_W, CANVAS_H);
      const prevData = prevCtx.getImageData(0, 0, CANVAS_W, CANVAS_H);
      let totalDx = 0, totalDy = 0, changedPixels = 0;

      for (let y = 0; y < CANVAS_H; y += 4) {
        for (let x = 0; x < CANVAS_W; x += 4) {
          const i = (y * CANVAS_W + x) * 4;
          const dr = curData.data[i] - prevData.data[i];
          const dg = curData.data[i + 1] - prevData.data[i + 1];
          const db = curData.data[i + 2] - prevData.data[i + 2];
          const diff = Math.abs(dr) + Math.abs(dg) + Math.abs(db);
          if (diff > 15) {
            changedPixels++;
            if (x > 4) {
              const li = (y * CANVAS_W + (x - 4)) * 4;
              const ldiff = Math.abs(curData.data[li] - prevData.data[li]);
              if (ldiff < diff) totalDx -= 1;
            }
            if (x < CANVAS_W - 8) {
              const ri = (y * CANVAS_W + (x + 4)) * 4;
              const rdiff = Math.abs(curData.data[ri] - prevData.data[ri]);
              if (rdiff < diff) totalDx += 1;
            }
            if (y > 4) {
              const ui = ((y - 4) * CANVAS_W + x) * 4;
              const udiff = Math.abs(curData.data[ui] - prevData.data[ui]);
              if (udiff < diff) totalDy -= 1;
            }
            if (y < CANVAS_H - 8) {
              const di = ((y + 4) * CANVAS_W + x) * 4;
              const ddiff = Math.abs(curData.data[di] - prevData.data[di]);
              if (ddiff < diff) totalDy += 1;
            }
          }
        }
      }

      if (changedPixels > 20) {
        const now = performance.now() - startTime;
        camSamples.push({
          t: Math.round(now),
          x: round(totalDx / Math.max(changedPixels, 1) * 10),
          y: round(totalDy / Math.max(changedPixels, 1) * 10),
          z: 0,
        });
        if (camSamples.length > 600) camSamples.shift();
      }
    }

    const prevCanvas = document.createElement("canvas");
    prevCanvas.width = CANVAS_W;
    prevCanvas.height = CANVAS_H;
    const pctx = prevCanvas.getContext("2d");
    if (pctx) pctx.drawImage(canvas, 0, 0);
    return pctx;
  } catch {
    return prevCtx;
  }
}

export default function PE001Page() {
  const [phase, setPhase] = useState<"idle" | "countdown" | "capturing" | "waiting" | "complete">("idle");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [camCount, setCamCount] = useState(0);
  const [trackCalls, setTrackCalls] = useState(0);
  const [imuCount, setImuCount] = useState(0);
  const [phoneStatus, setPhoneStatus] = useState("");
  const [evidence, setEvidence] = useState<EngineEvidence | null>(null);
  const [displayVerdict, setDisplayVerdict] = useState<Verdict | null>(null);
  const [copyStatus, setCopyStatus] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const camSamplesRef = useRef<CameraSample[]>([]);
  const startTimeRef = useRef(0);

  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (trackRef.current) clearInterval(trackRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: CANVAS_W, height: CANVAS_H, frameRate: 15 } });
    if (!videoRef.current) return;
    streamRef.current = stream;
    videoRef.current.srcObject = stream;
    await videoRef.current.play();
  }

  function stopCamera() {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (trackRef.current) { clearInterval(trackRef.current); trackRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function run() {
    setPhase("countdown");
    for (let i = 3; i >= 1; i--) { setCountdown(i); await sleep(1000); }

    camSamplesRef.current = [];
    setCamCount(0);
    setTrackCalls(0);
    setImuCount(0);
    setEvidence(null);
    setDisplayVerdict(null);

    await startCamera();
    startTimeRef.current = performance.now();

    setPhase("capturing");
    setElapsed(0);

    // Motion tracking at 8fps
    let prevCtx: CanvasRenderingContext2D | null = null;
    let callCount = 0;
    trackRef.current = setInterval(() => {
      callCount++;
      if (videoRef.current && canvasRef.current) {
        prevCtx = trackMotion(prevCtx, canvasRef.current, videoRef.current, camSamplesRef.current, startTimeRef.current) || prevCtx;
        setCamCount(camSamplesRef.current.length);
      }
      setTrackCalls(callCount);
    }, 125);

    const t0 = performance.now();
    await new Promise<void>((resolve) => {
      const t = setInterval(() => {
        const e = (performance.now() - t0) / 1000;
        setElapsed(e);
        if (e >= DURATION) { clearInterval(t); resolve(); }
      }, 100);
    });

    if (trackRef.current) clearInterval(trackRef.current);
    stopCamera();
    setPhase("waiting");
    setPhoneStatus("polling...");

    // Fetch phone IMU from API
    const pollStart = Date.now();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/pe001/session");
        const data = await res.json();
        if (data.ready) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setPhoneStatus("received");
          setImuCount(data.imuSamples.length);
          analyze(data.imuSamples);
        } else if (Date.now() - pollStart > 120_000) {
          clearInterval(pollRef.current!);
          pollRef.current = null;
          setPhoneStatus("timeout");
          setPhase("idle");
        }
      } catch { /* retry */ }
    }, 1000);
  }

  function analyze(imuSamples: IMUSample[]) {
    const imuEvents = detectJerkPeaks(imuSamples);
    const camEvents = detectDirectionChanges(camSamplesRef.current);
    const { matches } = matchEvents(imuEvents, camEvents);
    const totalDuration = Math.max(
      imuEvents.length > 0 ? imuEvents[imuEvents.length - 1].t : 0,
      camEvents.length > 0 ? camEvents[camEvents.length - 1].t : 0,
      DURATION * 1000,
    );
    const ev = buildEvidence(imuEvents, camEvents, matches, [], [], totalDuration);
    setEvidence(ev);
    hashEvidence(ev).then((d) => { if (d) setEvidence((prev) => (prev ? { ...prev, evidenceDigest: d } : prev)); });
    setDisplayVerdict(evaluatePolicy({ policyId: "EE-002", acceptThreshold: 0.70, rejectThreshold: 0.35 }, ev.confidence ?? 0));
    setPhase("complete");
  }

  function sc(s: string) { return s === "PASS" ? "#3fb950" : s === "FAIL" ? "#f85149" : "#d29922"; }
  function si(s: string) { return s === "PASS" ? "✓" : s === "FAIL" ? "✗" : "—"; }

  return (
    <div className="min-h-screen bg-[#02040a] text-[#f8feff] font-mono">
      <header className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link href="/research" className="text-white/30 text-[11px] tracking-[0.2em] uppercase hover:text-white/60">← Research</Link>
        <span className="text-white/15 text-[9px] tracking-[0.3em] uppercase">PE-001</span>
        <div className="w-16" />
      </header>

      <main className="max-w-lg mx-auto px-4 py-12 space-y-6">
        <div className="text-center space-y-3">
          <h1 className="text-white/85 text-2xl font-light">PE-001 Bridge</h1>
          <p className="text-white/35 text-[14px]" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
            Desktop camera (motion pixels) + phone IMU. No MediaPipe needed.
          </p>
        </div>

        {/* Camera preview + motion tracking */}
        <div className="flex justify-center">
          <video ref={videoRef} className="w-64 h-48 object-cover border border-white/10 rounded" playsInline muted />
        </div>
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} style={{ position: "absolute", left: -9999 }} />

        {phase === "idle" && (
          <div className="space-y-4">
            <p className="text-white/25 text-[11px] text-center" style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}>
              1. Click Start Recording<br />2. On phone: open PE-001 Phone, click Record IMU<br />3. Move both together for 8s
            </p>
            <button onClick={run} className="w-full py-5 bg-white/[0.04] border border-white/10 text-white/70 text-[15px] tracking-[0.05em] hover:bg-white/[0.08] transition-all">
              Start Recording
            </button>
          </div>
        )}

        {phase === "countdown" && (
          <div className="flex flex-col items-center py-24 gap-6">
            <div className="text-[100px] font-light text-[#90c8ff] leading-none">{countdown}</div>
          </div>
        )}

        {phase === "capturing" && (
          <div className="space-y-4">
            <div className="flex justify-between text-[10px]">
              <span className="text-[#90c8ff]/50">{elapsed.toFixed(1)}s / {DURATION}s</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#90c8ff]/60 to-[#a371f7]/60 rounded-full" style={{ width: `${(elapsed / DURATION) * 100}%` }} />
            </div>
            <div className="text-center p-6 border-2 border-[#d29922]/40 bg-[#d29922]/[0.06]">
              <div className="text-[#d29922] text-[20px] font-bold">{trackCalls} scans</div>
              <div className="text-white/50 text-[14px] mt-1">{camCount} motion events</div>
            </div>
          </div>
        )}

        {phase === "waiting" && (
          <div className="text-center p-8 border border-[#d29922]/20 bg-[#d29922]/[0.03]">
            <div className="text-[#d29922]/60 text-[12px] animate-pulse">Waiting for phone data...</div>
          </div>
        )}

        {phase === "complete" && evidence && displayVerdict && (
          <div className="space-y-4">
            <button onClick={() => {
              const lines = [`Verdict: ${displayVerdict}`, `Camera: ${camCount} events, IMU: ${imuCount} samples`, ...evidence.diagnostics];
              navigator.clipboard.writeText(lines.join("\n")).then(() => { setCopyStatus("✓ Copied!"); setTimeout(() => setCopyStatus(""), 2000); }).catch(() => {});
            }} className="w-full py-3 border border-[#d29922]/40 text-[#d29922]/70 text-[11px] tracking-[0.1em] uppercase hover:border-[#d29922] transition-all">
              {copyStatus || "📋 Copy Results"}
            </button>

            <div className={`text-center p-6 border-2 ${displayVerdict === "PASS" ? "border-[#3fb950]/40 bg-[#3fb950]/[0.04]" : "border-[#f85149]/40 bg-[#f85149]/[0.04]"} space-y-3`}>
              <div className="text-white/20 text-[9px] tracking-[0.2em] uppercase">Confidence</div>
              <div className="text-[36px] font-light" style={{ color: sc(displayVerdict) }}>
                {evidence.confidence ? `${(evidence.confidence * 100).toFixed(0)}%` : "—"}
              </div>
            </div>

            {evidence.components.map((comp) => (
              <div key={comp.metric} className="flex items-center justify-between p-2 border border-white/5">
                <div className="space-y-0.5">
                  <div className="text-[11px] text-white/50">{comp.metric}</div>
                  <div className="text-[9px] text-white/20">{comp.value.toFixed(3)} vs {comp.threshold}</div>
                </div>
                <span style={{ color: sc(comp.status), fontSize: "13px" }}>{si(comp.status)}</span>
              </div>
            ))}
            <div className="space-y-1">
              {evidence.diagnostics.map((d, i) => (
                <div key={i} className={`text-[10px] font-mono ${d.startsWith("✓") ? "text-[#3fb950]/70" : d.startsWith("✗") ? "text-[#f85149]/70" : "text-white/25"}`}>{d}</div>
              ))}
            </div>
            <button onClick={() => setPhase("idle")} className="w-full py-4 border border-white/10 text-white/25 text-[11px] tracking-[0.2em] uppercase hover:border-white/30 transition-all">↻ New Session</button>
          </div>
        )}
      </main>
    </div>
  );
}
