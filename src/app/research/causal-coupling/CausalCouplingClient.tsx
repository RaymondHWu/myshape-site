"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  type ComponentEvidence,
  type EngineEvidence,
  type Verdict,
  computeStatus,
  computeHint,
  hashEvidence,
  defaultPolicy,
} from "@/lib/evidence/types";

// ═══════════════════════════════════════════════════════════════
// EE-002 · Event-Level Causal Coupling
// Evidence Engine that derives causal evidence from the temporal
// consistency of independent physical observations.
// Outputs EngineEvidence — unified shape with EE-001.
// ═══════════════════════════════════════════════════════════════

// ── Internal types ──

interface IMUSample { t: number; ax: number; ay: number; az: number; rx: number; ry: number; rz: number; interval: number; }
interface CameraSample { t: number; x: number; y: number; z: number; }
interface JerkEvent { t: number; magnitude: number; ax: number; ay: number; }
interface DirChangeEvent { t: number; angleDeg: number; fromDx: number; fromDy: number; toDx: number; toDy: number; }
interface MatchedEvent { imu: JerkEvent; cam: DirChangeEvent; dtMs: number; directionAligned: boolean; }

// ── Candidate Parameters v0.2 (calibrated from real phone data 2026-07-14) ──

const DIRECTION_TOLERANCE_DEG = 90;  // empirical — evaluate 45°/60°/120°
const MATCH_WINDOW_MS = 500;         // widened: real sensor events are looser than simulation
const JERK_MIN_THRESHOLD = 0.2;      // lowered from 0.5 — natural hand motion produces subtler jerk than ideal sine waves
const DIR_CHANGE_MIN_ANGLE_DEG = 45;
const MIN_SPEED = 0.2;               // lowered from 0.3
const CAMERA_PIPELINE_LATENCY_MS = 80; // MediaPipe pose.onResults fires ~80ms after frame capture

// Thresholds for ComponentEvidence status
const TEMPORAL_ALIGNMENT_THRESHOLD = 0.25;  // lowered from 0.40 — real-world rates are lower than ideal
const DIRECTION_AGREEMENT_THRESHOLD = 0.50;
const EVENT_DENSITY_THRESHOLD = 0.2;        // lowered from 0.3
const CAUSAL_EVIDENCE_THRESHOLD = 0.30;      // lowered from 0.40

type Phase = "idle" | "countdown" | "capturing" | "complete";

// ── Signal processing ──

function median(arr: number[]): number { const s = [...arr].sort((a, b) => a - b); const m = Math.floor(s.length / 2); return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m]; }
function round(v: number | null | undefined): number { if (v === null || v === undefined) return 0; return Math.round(v * 1000) / 1000; }
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

// ── Jerk peak detection ──

function detectJerkPeaks(samples: IMUSample[]): JerkEvent[] {
  if (samples.length < 10) return [];
  const jerkMag: number[] = [];
  const jerkVec: { ax: number; ay: number; t: number }[] = [];
  for (let i = 1; i < samples.length; i++) {
    const dt = (samples[i].t - samples[i - 1].t) / 1000;
    if (dt <= 0 || dt > 0.5) continue;
    const jx = (samples[i].ax - samples[i - 1].ax) / dt;
    const jy = (samples[i].ay - samples[i - 1].ay) / dt;
    const jz = (samples[i].az - samples[i - 1].az) / dt;
    jerkMag.push(Math.sqrt(jx * jx + jy * jy + jz * jz));
    jerkVec.push({ ax: jx, ay: jy, t: samples[i].t });
  }
  if (jerkMag.length < 5) return [];
  const med = median(jerkMag);
  const absDevs = jerkMag.map((v) => Math.abs(v - med));
  const mad = median(absDevs);
  const threshold = Math.max(med + 3 * mad, JERK_MIN_THRESHOLD);
  const peaks: JerkEvent[] = [];
  let lastPeakT = -Infinity;
  for (let i = 1; i < jerkMag.length - 1; i++) {
    if (jerkMag[i] > threshold && jerkMag[i] > jerkMag[i - 1] && jerkMag[i] > jerkMag[i + 1]) {
      if (jerkVec[i].t - lastPeakT >= 200) { peaks.push({ t: jerkVec[i].t, magnitude: jerkMag[i], ax: jerkVec[i].ax, ay: jerkVec[i].ay }); lastPeakT = jerkVec[i].t; }
    }
  }
  return peaks;
}

// ── Direction change detection ──

function detectDirectionChanges(samples: CameraSample[]): DirChangeEvent[] {
  if (samples.length < 6) return [];
  const smoothed: CameraSample[] = [];
  for (let i = 0; i < samples.length; i++) {
    let sx = samples[i].x, sy = samples[i].y, sz = samples[i].z, c = 1;
    if (i > 0) { sx += samples[i - 1].x; sy += samples[i - 1].y; sz += samples[i - 1].z; c++; }
    if (i < samples.length - 1) { sx += samples[i + 1].x; sy += samples[i + 1].y; sz += samples[i + 1].z; c++; }
    smoothed.push({ t: samples[i].t, x: sx / c, y: sy / c, z: sz / c });
  }
  const velocities: { t: number; dx: number; dy: number; speed: number }[] = [];
  for (let i = 2; i < smoothed.length; i++) {
    const dt = (smoothed[i].t - smoothed[i - 2].t) / 1000;
    if (dt <= 0 || dt > 0.5) continue;
    const dx = (smoothed[i].x - smoothed[i - 2].x) / dt;
    const dy = (smoothed[i].y - smoothed[i - 2].y) / dt;
    velocities.push({ t: smoothed[i].t, dx, dy, speed: Math.sqrt(dx * dx + dy * dy) });
  }
  if (velocities.length < 4) return [];
  const events: DirChangeEvent[] = [];
  let lastEventT = -Infinity;
  for (let i = 2; i < velocities.length; i++) {
    const prev = velocities[i - 2]; const curr = velocities[i];
    if (prev.speed < MIN_SPEED || curr.speed < MIN_SPEED) continue;
    const dot = prev.dx * curr.dx + prev.dy * curr.dy;
    const cross = prev.dx * curr.dy - prev.dy * curr.dx;
    const angleDeg = (Math.atan2(Math.abs(cross), dot) * 180) / Math.PI;
    if (angleDeg > DIR_CHANGE_MIN_ANGLE_DEG && curr.t - lastEventT >= 300) {
      events.push({ t: curr.t, angleDeg: Math.round(angleDeg), fromDx: prev.dx, fromDy: prev.dy, toDx: curr.dx, toDy: curr.dy });
      lastEventT = curr.t;
    }
  }
  return events;
}

// ── Cross-modal matching ──

function matchEvents(imuEvents: JerkEvent[], camEvents: DirChangeEvent[]) {
  const usedCam = new Set<number>(); const matches: MatchedEvent[] = [];
  for (const imu of imuEvents) {
    let bestIdx = -1, bestDt = Infinity;
    for (let j = 0; j < camEvents.length; j++) {
      if (usedCam.has(j)) continue;
      const dt = Math.abs(imu.t - camEvents[j].t);
      if (dt < MATCH_WINDOW_MS && dt < bestDt) { bestDt = dt; bestIdx = j; }
    }
    if (bestIdx >= 0) {
      usedCam.add(bestIdx);
      const cam = camEvents[bestIdx];
      const imuDir = Math.atan2(imu.ay, imu.ax);
      const camDir = Math.atan2(cam.toDy, cam.toDx);
      const dirDiff = Math.abs(imuDir - camDir);
      const directionAligned = Math.min(dirDiff, 2 * Math.PI - dirDiff) < (DIRECTION_TOLERANCE_DEG * Math.PI / 180);
      matches.push({ imu, cam, dtMs: Math.round(bestDt), directionAligned });
    }
  }
  return { matches, unmatchedIMU: imuEvents.filter((_, i) => !matches.some((m) => m.imu === imuEvents[i])), unmatchedCam: camEvents.filter((_, j) => !usedCam.has(j)) };
}

// ── Evidence Builder (outputs standard EngineEvidence) ──

/** Experimental prototype aggregation v0.1. Linear weights are provisional. */
function buildEvidence(
  imuEvents: JerkEvent[], camEvents: DirChangeEvent[],
  matches: MatchedEvent[], unmatchedIMU: JerkEvent[], unmatchedCam: DirChangeEvent[],
  totalDuration: number,
): EngineEvidence {
  const components: ComponentEvidence[] = [];
  const diagnostics: string[] = [];

  // ── Event Density ──
  const imuDensity = totalDuration > 0 ? imuEvents.length / (totalDuration / 1000) : 0;
  const camDensity = totalDuration > 0 ? camEvents.length / (totalDuration / 1000) : 0;
  const minDensity = Math.min(imuDensity, camDensity);
  const densityValue = Math.min(1, minDensity / 1.5);

  if (imuEvents.length === 0 && camEvents.length === 0) {
    diagnostics.push("✗ no events detected in either channel — insufficient motion or sensor failure");
  } else if (imuEvents.length === 0) {
    diagnostics.push("✗ no IMU jerk peaks detected — sensor may be inactive or motion too subtle");
  } else if (camEvents.length === 0) {
    diagnostics.push("✗ no camera direction changes detected — insufficient landmark data");
  }

  components.push({
    engine: "EE-002", metric: "EventDensity", value: densityValue, threshold: EVENT_DENSITY_THRESHOLD,
    status: computeStatus(densityValue, EVENT_DENSITY_THRESHOLD),
    explanation: `IMU:${imuDensity.toFixed(1)}/s Cam:${camDensity.toFixed(1)}/s (need ≥${EVENT_DENSITY_THRESHOLD}/s)`,
    hint: computeHint("EventDensity", computeStatus(densityValue, EVENT_DENSITY_THRESHOLD)),
  });
  if (minDensity >= EVENT_DENSITY_THRESHOLD) diagnostics.push("✓ event density sufficient");
  else if (imuEvents.length > 0 || camEvents.length > 0) diagnostics.push(`✗ insufficient event density (IMU:${imuDensity.toFixed(1)}/s Cam:${camDensity.toFixed(1)}/s)`);

  // ── Temporal Alignment ──
  const matchRate = Math.max(imuEvents.length, camEvents.length) > 0
    ? matches.length / Math.max(imuEvents.length, camEvents.length) : 0;

  components.push({
    engine: "EE-002", metric: "TemporalAlignment", value: matchRate, threshold: TEMPORAL_ALIGNMENT_THRESHOLD,
    status: computeStatus(matchRate, TEMPORAL_ALIGNMENT_THRESHOLD),
    explanation: `${matches.length}/${Math.max(imuEvents.length, camEvents.length)} events matched within ±${MATCH_WINDOW_MS}ms`,
    hint: computeHint("TemporalAlignment", computeStatus(matchRate, TEMPORAL_ALIGNMENT_THRESHOLD)),
  });
  if (matchRate >= TEMPORAL_ALIGNMENT_THRESHOLD) diagnostics.push("✓ temporal alignment — events coupled across modalities");
  else if (matches.length === 0) diagnostics.push("✗ no matching event pairs — streams may describe different physical events");
  else diagnostics.push(`✗ weak temporal alignment (${matches.length}/${Math.max(imuEvents.length, camEvents.length)} matched)`);

  // Temporal precision check
  if (matches.length > 0) {
    const avgDt = matches.reduce((s, m) => s + Math.abs(m.dtMs), 0) / matches.length;
    if (avgDt > 150) diagnostics.push(`⚠ high temporal jitter (avg Δ${avgDt.toFixed(0)}ms) — timing is loose`);
  }

  // ── Direction Agreement ──
  const directionRate = matches.length > 0 ? matches.filter((m) => m.directionAligned).length / matches.length : 0;
  const dirStatus = matches.length === 0 ? "INSUFFICIENT" as const : computeStatus(directionRate, DIRECTION_AGREEMENT_THRESHOLD);

  components.push({
    engine: "EE-002", metric: "DirectionAgreement", value: directionRate, threshold: DIRECTION_AGREEMENT_THRESHOLD,
    status: dirStatus,
    explanation: matches.length === 0 ? "no matched pairs" : `${matches.filter((m) => m.directionAligned).length}/${matches.length} aligned within ${DIRECTION_TOLERANCE_DEG}°`,
    hint: computeHint("DirectionAgreement", dirStatus),
  });
  if (matches.length === 0) diagnostics.push("— direction agreement: no matched pairs to evaluate");
  else if (dirStatus === "PASS") diagnostics.push("✓ direction agreement — force and motion aligned");
  else diagnostics.push("✗ direction disagreement — streams may point to different motions");

  // ── Causal Evidence (experimental aggregation) ──
  const causalValue = matchRate * 0.45 + directionRate * 0.30 + densityValue * 0.25;
  components.push({
    engine: "EE-002", metric: "CausalEvidence", value: causalValue, threshold: CAUSAL_EVIDENCE_THRESHOLD,
    status: computeStatus(causalValue, CAUSAL_EVIDENCE_THRESHOLD),
    explanation: "experimental prototype aggregation v0.1: matchRate×0.45 + directionAgreement×0.30 + eventDensity×0.25",
    hint: computeHint("CausalEvidence", computeStatus(causalValue, CAUSAL_EVIDENCE_THRESHOLD)),
  });

  // ── CFC-005 check (threshold = 250ms — camera naturally leads by ~160ms) ──
  for (const m of matches) {
    if (m.cam.t < m.imu.t - 250) {
      diagnostics.push(`⚠ CFC-005 · Causal Inversion: camera direction change @${m.cam.t}ms precedes IMU jerk @${m.imu.t}ms by ${m.imu.t - m.cam.t}ms`);
      break;
    }
  }

  return { engineId: "EE-002", timestamp: new Date().toISOString(), components, diagnostics };
}

// ── Component ──

export default function CausalCouplingClient() {
  const [hydrated, setHydrated] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [imuCount, setImuCount] = useState(0);
  const [camCount, setCamCount] = useState(0);
  const [cameraStatus, setCameraStatus] = useState("");
  const [isSimulated, setIsSimulated] = useState(false);
  const [noSensors, setNoSensors] = useState(false);
  const [evidence, setEvidence] = useState<EngineEvidence | null>(null);
  const [displayVerdict, setDisplayVerdict] = useState<Verdict | null>(null);
  // Internal data for timeline rendering
  const [internalData, setInternalData] = useState<{
    matches: MatchedEvent[]; unmatchedIMU: JerkEvent[]; unmatchedCam: DirChangeEvent[];
  } | null>(null);

  const [copyStatus, setCopyStatus] = useState("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const imuSamplesRef = useRef<IMUSample[]>([]);
  const camSamplesRef = useRef<CameraSample[]>([]);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRealSensorRef = useRef(false);
  const startTimeRef = useRef(0);
  const lastIMUEventRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const poseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const DURATION = 8;

  useEffect(() => { setHydrated(true); }, []);
  useEffect(() => { return () => { stopAll(); }; }, []);

  function stopAll() {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (simTimerRef.current) { clearInterval(simTimerRef.current); simTimerRef.current = null; }
    if (poseIntervalRef.current) { clearInterval(poseIntervalRef.current); poseIntervalRef.current = null; }
    window.removeEventListener("devicemotion", handleIMU);
  }

  const handleIMU = useCallback((e: DeviceMotionEvent) => {
    hasRealSensorRef.current = true;
    const now = performance.now(); const t = now - startTimeRef.current;
    const iv = lastIMUEventRef.current > 0 ? now - lastIMUEventRef.current : 0; lastIMUEventRef.current = now;
    imuSamplesRef.current.push({ t: Math.round(t), ax: round(e.acceleration?.x), ay: round(e.acceleration?.y), az: round(e.acceleration?.z), rx: round(e.rotationRate?.alpha), ry: round(e.rotationRate?.beta), rz: round(e.rotationRate?.gamma), interval: Math.round(iv * 100) / 100 });
    setImuCount(imuSamplesRef.current.length);
  }, []);

  const startSim = useCallback(() => {
    if (simTimerRef.current) return; let t = 0;
    simTimerRef.current = setInterval(() => {
      const ax = Math.sin(t * 0.025) * 3 + Math.sin(t * 0.08) * 1.5 + (Math.random() - 0.5) * 0.5;
      const ay = Math.cos(t * 0.03) * 2.5 + Math.cos(t * 0.07) * 1.2 + (Math.random() - 0.5) * 0.5;
      imuSamplesRef.current.push({ t, ax, ay, az: 9.8 + Math.sin(t * 0.015) * 0.4, rx: Math.cos(t * 0.02) * 30 + (Math.random() - 0.5) * 6, ry: Math.sin(t * 0.022) * 25 + (Math.random() - 0.5) * 5, rz: Math.sin(t * 0.018) * 15 + (Math.random() - 0.5) * 4, interval: 16 + (Math.random() - 0.5) * 6 });
      if (t % 100 < 16) { camSamplesRef.current.push({ t, x: Math.sin(t * 0.025) * 15 + Math.cos(t * 0.08) * 8 + (Math.random() - 0.5) * 3, y: Math.cos(t * 0.03) * 12 + Math.sin(t * 0.07) * 6 + (Math.random() - 0.5) * 3, z: (Math.random() - 0.5) * 2 }); setCamCount(camSamplesRef.current.length); }
      setImuCount(imuSamplesRef.current.length); t += 16;
    }, 16);
  }, []);

  const stopSim = useCallback(() => { if (simTimerRef.current) { clearInterval(simTimerRef.current); simTimerRef.current = null; } }, []);

  async function startCamera() {
    try {
      setCameraStatus("Starting...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, frameRate: 15 } });
      if (!videoRef.current) return; streamRef.current = stream; videoRef.current.srcObject = stream; await videoRef.current.play();
      if (!(window as any).Pose) { setCameraStatus("Loading MediaPipe..."); await new Promise<void>((r) => { const script = document.createElement("script"); script.src = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js"; script.crossOrigin = "anonymous"; script.onload = () => r(); script.onerror = () => r(); document.head.appendChild(script); }); }
      if (!(window as any).Pose) { setCameraStatus("MediaPipe unavailable"); return; }
      const MP_BASE = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404";
      const pose = new (window as any).Pose({ locateFile: (f: string) => { const url = `${MP_BASE}/${f}`; if (!f || f.includes("undefined")) throw new Error(`Invalid MediaPipe file: ${f}`); return url; } });
      pose.setOptions({ modelComplexity: 0, smoothLandmarks: false, enableSegmentation: false });
      pose.onResults((results: any) => { if (results.poseLandmarks) { const lw = results.poseLandmarks[15]; if (lw) { const now = performance.now() - startTimeRef.current; camSamplesRef.current.push({ t: Math.round(now), x: round(lw.x * 100), y: round(lw.y * 100), z: round(lw.z * 100) }); if (camSamplesRef.current.length > 600) camSamplesRef.current.shift(); setCamCount(camSamplesRef.current.length); } } });
      poseIntervalRef.current = setInterval(async () => { if (videoRef.current) { try { await pose.send({ image: videoRef.current }); } catch { /* */ } } }, 100);
      setCameraStatus("Active");
    } catch { setCameraStatus("Unavailable"); }
  }

  function stopCamera() { if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; } if (poseIntervalRef.current) { clearInterval(poseIntervalRef.current); poseIntervalRef.current = null; } if (videoRef.current) videoRef.current.srcObject = null; setCameraStatus(""); }

  const run = useCallback(async () => {
    setPhase("countdown"); setEvidence(null); setDisplayVerdict(null); setInternalData(null);
    for (let i = 3; i >= 1; i--) { setCountdown(i); await sleep(1000); }
    imuSamplesRef.current = []; camSamplesRef.current = []; setImuCount(0); setCamCount(0); hasRealSensorRef.current = false;
    await startCamera();
    window.addEventListener("devicemotion", handleIMU);
    startTimeRef.current = performance.now(); lastIMUEventRef.current = 0;
    if (isSimulated) { setNoSensors(true); startSim(); } else { setTimeout(() => { if (!hasRealSensorRef.current && !simTimerRef.current) { setNoSensors(true); setIsSimulated(true); startSim(); } }, 1500); }
    setPhase("capturing"); setElapsed(0);
    const captureStart = performance.now();
    const timer = setInterval(() => { const e = (performance.now() - captureStart) / 1000; setElapsed(e); if (e >= DURATION) { clearInterval(timer); finish(); } }, 100);

    function finish() {
      window.removeEventListener("devicemotion", handleIMU); stopSim(); stopCamera();
      const imuEvents = detectJerkPeaks(imuSamplesRef.current);
      // Camera events naturally precede IMU events by ~160ms (visual trajectory change
      // is detectable before the corresponding force builds up). No compensation needed —
      // we rely on the widened match window (±500ms) to absorb this physical lag.
      const camEvents = detectDirectionChanges(camSamplesRef.current);
      const { matches, unmatchedIMU, unmatchedCam } = matchEvents(imuEvents, camEvents);
      const lastImuT = imuEvents.length > 0 ? imuEvents[imuEvents.length - 1].t : 0;
      const lastCamT = camEvents.length > 0 ? camEvents[camEvents.length - 1].t : 0;
      const totalDuration = Math.max(lastImuT, lastCamT, DURATION * 1000);

      const ev = buildEvidence(imuEvents, camEvents, matches, unmatchedIMU, unmatchedCam, totalDuration);
      setEvidence(ev);
      hashEvidence(ev).then((d) => { if (d) setEvidence((prev) => prev ? { ...prev, evidenceDigest: d } : prev); });
      setDisplayVerdict(defaultPolicy([ev]));
      setInternalData({ matches, unmatchedIMU, unmatchedCam });
      setPhase("complete");
    }
  }, [isSimulated, handleIMU, startSim, stopSim]);

  // ── Render helpers ──

  function statusColor(s: string): string { if (s === "PASS") return "#3fb950"; if (s === "FAIL") return "#f85149"; return "#d29922"; }
  function statusIcon(s: string): string { if (s === "PASS") return "✓"; if (s === "FAIL") return "✗"; return "—"; }

  // ── Render ──

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link href="/research" className="text-white/30 text-[11px] tracking-[0.2em] uppercase hover:text-white/60">← Research</Link>
        <span className="text-white/15 text-[9px] tracking-[0.3em] uppercase">EE-002</span>
        <div className="w-16" />
      </header>
      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="text-5xl">⛓️</div>
          <h1 className="text-white/80 text-[22px] font-light">Event-Level Causal Coupling</h1>
          <p className="text-white/30 text-[13px] leading-relaxed max-w-sm mx-auto">
            Evidence Engine that derives causal evidence from the temporal consistency of independent physical observations.
          </p>
        </div>

        <video ref={videoRef} className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none" playsInline muted />
        {/* Hydration check — if this says "NO", React JS didn't load */}
        <div className={`p-2 border text-[11px] font-mono text-center ${hydrated ? "border-green-400/40 text-green-400/60" : "border-red-400/40 text-red-400/60"}`}>
          {hydrated ? "✓ Hydrated — React running" : "✗ NOT hydrated — JS not loaded"}
        </div>
        <div className="p-2 border border-white/5 text-[9px] font-mono text-white/20 flex justify-between">
          <span>IMU: {imuCount} | Cam: {camCount} | {cameraStatus || "off"} | {isSimulated ? "SIM" : "LIVE"}</span>
          <span>{evidence ? "✓ Evidence" : "○ Idle"}</span>
        </div>

        {phase === "idle" && (
          <div className="space-y-4">
            {noSensors && <div className="p-3 border border-yellow-400/20 bg-yellow-400/[0.04] text-yellow-400/60 text-[11px] text-center">No physical sensors — simulation active. Use HTTPS on a mobile device for real testing.</div>}
            <button onClick={() => setIsSimulated(!isSimulated)} className={`w-full py-2 border text-[11px] tracking-[0.12em] uppercase ${isSimulated ? "border-[#90c8ff]/30 text-[#90c8ff]/50 bg-[#90c8ff]/5" : "border-white/5 text-white/15 hover:border-white/15 hover:text-white/30"}`}>{isSimulated ? "⚡ Simulation ON" : "💻 Simulate (if no sensors)"}</button>
            <button onClick={run} className="w-full py-5 bg-gradient-to-r from-[#90c8ff]/20 to-[#a371f7]/20 border-2 border-[#90c8ff]/40 text-[#90c8ff] text-[16px] tracking-[0.15em] uppercase font-bold hover:border-[#90c8ff] transition-all active:scale-[0.98]">▶ Run Causal Analysis</button>
          </div>
        )}

        {phase === "countdown" && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="text-white/20 text-[12px] tracking-[0.3em] uppercase">Starting Capture</div>
            <div className="text-[120px] font-light text-[#90c8ff] leading-none" style={{ textShadow: "0 0 60px rgba(144,200,255,0.4)", animation: "countdownPulse 1s ease-in-out infinite" }}>{countdown}</div>
          </div>
        )}

        {phase === "capturing" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase"><span className="text-[#90c8ff]/50">Capturing</span><span className="text-[#90c8ff]/50 font-mono">{elapsed.toFixed(1)}s / {DURATION}s</span></div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#90c8ff]/60 to-[#a371f7]/60 rounded-full transition-all duration-100" style={{ width: `${(elapsed / DURATION) * 100}%` }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div className="p-3 border border-[#90c8ff]/10"><div className="text-[#90c8ff]/40 text-[8px] uppercase mb-1">IMU</div><div className="text-white/50 font-mono">{imuCount} samples</div></div>
              <div className="p-3 border border-[#a371f7]/10"><div className="text-[#a371f7]/40 text-[8px] uppercase mb-1">Camera</div><div className="text-white/50 font-mono">{camCount} frames</div></div>
            </div>
            <div className="text-center p-8 border border-dashed border-white/10 text-white/30 text-[14px]">Move naturally — any motion works.</div>
          </div>
        )}

        {/* ── Results ── */}
        {phase === "complete" && evidence && displayVerdict && (
          <div className="space-y-6">
            {/* ── Copy All ── */}
            <button onClick={() => {
              const lines = [
                `Verdict: ${displayVerdict}`,
                `IMU: ${imuCount} samples, Cam: ${camCount} frames`,
                ...evidence.diagnostics,
              ];
              const text = lines.join("\n");
              navigator.clipboard.writeText(text).then(() => { setCopyStatus("✓ Copied!"); setTimeout(() => setCopyStatus(""), 2000); }).catch(() => setCopyStatus("Failed"));
            }} className="w-full py-3 border border-[#d29922]/40 text-[#d29922]/70 text-[11px] tracking-[0.1em] uppercase hover:border-[#d29922] transition-all">{copyStatus || "📋 Copy All Results"}</button>

            {/* Verdict — computed by Policy */}
            <div className="text-center p-6 border-2 border-[#a371f7]/40 bg-[#a371f7]/[0.04] space-y-3">
              <div className="text-white/20 text-[9px] tracking-[0.2em] uppercase">Policy Decision</div>
              <div className="text-[20px] font-light" style={{ color: statusColor(displayVerdict) }}>{displayVerdict.replace(/_/g, " ")}</div>
              <div className="text-white/25 text-[11px]">
                {displayVerdict === "PASS" ? "Strong causal coupling — both streams consistent with a single physical event."
                  : displayVerdict === "FAIL" ? "Weak coupling — streams may describe different physical events."
                  : "Insufficient evidence to evaluate causal coupling."}
              </div>
            </div>

            {/* ── Evidence Components (shared shape with EE-001) ── */}
            <div className="p-4 border border-white/10 bg-white/[0.02] space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-[10px] uppercase text-white/20">Evidence Components</div>
                <span className="text-[8px] text-white/10 font-mono">{evidence.engineId}</span>
              </div>
              {evidence.components.map((comp) => (
                <div key={comp.metric} className="flex items-center justify-between p-2 border border-white/5">
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-white/50">{comp.metric}</div>
                    <div className="text-[9px] text-white/20">{comp.value.toFixed(3)} vs {comp.threshold} — {comp.explanation}</div>
                  </div>
                  <span style={{ color: statusColor(comp.status), fontSize: "13px" }}>{statusIcon(comp.status)}</span>
                </div>
              ))}
            </div>

            {/* ── Diagnostic Log ── */}
            <div className="p-4 border border-white/10 bg-white/[0.02] space-y-2">
              <div className="text-[10px] uppercase text-white/20">Diagnostic Log</div>
              <div className="space-y-1">
                {evidence.diagnostics.map((d, i) => (
                  <div key={i} className={`text-[10px] font-mono leading-relaxed ${d.startsWith("✓") ? "text-[#3fb950]/70" : d.startsWith("✗") ? "text-[#f85149]/70" : d.startsWith("⚠") ? "text-[#d29922]/70" : "text-white/25"}`}>{d}</div>
                ))}
              </div>
            </div>

            {/* ── Timeline (internal data, not part of evidence) ── */}
            {internalData && (
              <div className="p-4 border border-white/10 bg-white/[0.02] space-y-3">
                <div className="text-[10px] uppercase text-white/20">Event Timeline</div>
                <div className="relative h-8 bg-white/[0.03] rounded overflow-hidden">
                  {internalData.matches.map((m, i) => (
                    <div key={i} className="absolute top-1 h-6 rounded" style={{ left: `${(m.imu.t / (DURATION * 1000)) * 100}%`, width: `${Math.max(1, (Math.abs(m.dtMs) / (DURATION * 1000)) * 100)}%`, backgroundColor: m.directionAligned ? "rgba(63,185,80,0.5)" : "rgba(248,81,73,0.5)" }} />
                  ))}
                  {internalData.unmatchedIMU.map((e, i) => (<div key={`imu-${i}`} className="absolute top-1 w-1 h-6 rounded bg-[#90c8ff]/40" style={{ left: `${(e.t / (DURATION * 1000)) * 100}%` }} />))}
                  {internalData.unmatchedCam.map((e, i) => (<div key={`cam-${i}`} className="absolute top-1 w-1 h-6 rounded bg-[#a371f7]/40" style={{ left: `${(e.t / (DURATION * 1000)) * 100}%` }} />))}
                </div>
                <div className="flex gap-4 text-[8px] text-white/20 flex-wrap">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#3fb950]/50" /> Aligned</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#f85149]/50" /> Misaligned</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#90c8ff]/40" /> Unmatched IMU</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#a371f7]/40" /> Unmatched Cam</span>
                </div>
              </div>
            )}

            {/* Policy note */}
            <div className="p-3 border border-white/5 bg-white/[0.01] text-[9px] font-mono text-white/15 space-y-1">
              <div className="text-white/20 text-[8px] uppercase mb-1">Policy · defaultPolicy v0.1</div>
              <div>All components must PASS. Verdict computed by VerificationPolicy — not stored in Evidence.</div>
              <div className="text-white/10">Candidate Parameters: DirectionTolerance={DIRECTION_TOLERANCE_DEG}° MatchWindow=±{MATCH_WINDOW_MS}ms</div>
            </div>

            <button onClick={() => { setPhase("idle"); setEvidence(null); setDisplayVerdict(null); setInternalData(null); }}
              className="w-full py-4 border border-white/10 text-white/25 text-[11px] tracking-[0.2em] uppercase hover:border-white/30 transition-all">↻ Run Again</button>
          </div>
        )}
      </main>
    </div>
  );
}
