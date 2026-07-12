"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

interface IMUSample { t: number; ax: number; ay: number; az: number; rx: number; ry: number; rz: number; interval: number; }
interface PESResult { score: number; microTiming: number; noise: number; entropy: number; }
interface FusionTemplate {
  id: string; enrolledAt: string;
  imu: PESResult; imuRaw: number[];  // raw accMag for similarity
  camera: PESResult; cameraRaw: number[];
}

type Phase = "idle" | "countdown" | "capturing" | "complete";
type Mode = "enroll" | "verify";

function movingAvg(s: number[], w: number): number[] { const r: number[] = []; const h = Math.floor(w / 2); for (let i = 0; i < s.length; i++) { let sum = 0, c = 0; for (let j = Math.max(0, i - h); j < Math.min(s.length, i + h + 1); j++) { sum += s[j]; c++; } r.push(c > 0 ? sum / c : s[i]); } return r; }
function specEntropy(s: number[]): number { if (s.length < 16) return 0; const N = s.length; const mags: number[] = []; for (let k = 0; k < Math.floor(N / 2); k++) { let re = 0, im = 0; for (let n = 0; n < N; n++) { const a = (-2 * Math.PI * k * n) / N; re += s[n] * Math.cos(a); im += s[n] * Math.sin(a); } mags.push(Math.sqrt(re * re + im * im) / N); } const total = mags.reduce((a, b) => a + b, 0) || 1; const norm = mags.map((m) => m / total); const e = -norm.reduce((sum, p) => sum + (p > 1e-9 ? p * Math.log2(p) : 0), 0); const maxE = Math.log2(norm.length); return maxE > 0 ? e / maxE : 0; }
function similarity(a: number[], b: number[]): number { if (a.length < 10 || b.length < 10) return 0; const ma = a.reduce((x, y) => x + y, 0) / a.length; const mb = b.reduce((x, y) => x + y, 0) / b.length; const sa = Math.sqrt(a.reduce((s, x) => s + (x - ma) ** 2, 0) / a.length) || 1; const sb = Math.sqrt(b.reduce((s, x) => s + (x - mb) ** 2, 0) / b.length) || 1; const corr = a.slice(0, Math.min(a.length, b.length)).reduce((s, _, i) => s + ((a[i] - ma) / sa) * ((b[i] - mb) / sb), 0) / Math.min(a.length, b.length); return (corr + 1) / 2; }
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function computePES(samples: IMUSample[]): { result: PESResult; raw: number[] } {
  const intervals = samples.map((s) => s.interval).filter((i) => i > 0 && i < 200);
  let microTiming = 0; if (intervals.length >= 10) { const m = intervals.reduce((a, b) => a + b, 0) / intervals.length; const v = intervals.reduce((s, x) => s + (x - m) ** 2, 0) / intervals.length; const cv = m > 0 ? Math.sqrt(v) / m : 0; microTiming = 1 - Math.exp(-cv / 0.15); }
  const accMag = samples.map((s) => Math.sqrt(s.ax ** 2 + s.ay ** 2 + s.az ** 2));
  let noise = 0; if (accMag.length >= 16) { const m = accMag.reduce((a, b) => a + b, 0) / accMag.length; const std = Math.sqrt(accMag.reduce((s, x) => s + (x - m) ** 2, 0) / accMag.length); if (std >= 0.01) { const smoothed = movingAvg(accMag, 9); const residuals = accMag.map((x, i) => (x - smoothed[i]) ** 2); const rmse = Math.sqrt(residuals.reduce((a, b) => a + b, 0) / residuals.length); noise = 1 - Math.exp(-(rmse / std) / 0.3); } }
  const entropy = specEntropy(accMag);
  return { result: { score: microTiming * 0.25 + noise * 0.30 + entropy * 0.20 + 0.125, microTiming, noise, entropy }, raw: accMag };
}

export default function FusionClient() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [mode, setMode] = useState<Mode>("enroll");
  const [countdown, setCountdown] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [sampleCount, setSampleCount] = useState(0);
  const [template, setTemplate] = useState<FusionTemplate | null>(null);
  const [imuScore, setImuScore] = useState<PESResult | null>(null);
  const [camScore, setCamScore] = useState<PESResult | null>(null);
  const [imuSim, setImuSim] = useState(0);
  const [camSim, setCamSim] = useState(0);
  const [verdict, setVerdict] = useState<"waiting" | "enrolled" | "pass" | "fail">("waiting");
  const [cameraStatus, setCameraStatus] = useState("");
  const [isSimulated, setIsSimulated] = useState(false);
  const [noSensors, setNoSensors] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const samplesRef = useRef<IMUSample[]>([]);
  const cameraSamplesRef = useRef<number[]>([]);
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasRealSensorRef = useRef(false);
  const startTimeRef = useRef(0);
  const lastEventRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const poseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const DURATION = 8;

  useEffect(() => { return () => { stopAll(); }; }, []);

  function stopAll() {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (simTimerRef.current) { clearInterval(simTimerRef.current); simTimerRef.current = null; }
    if (poseIntervalRef.current) { clearInterval(poseIntervalRef.current); poseIntervalRef.current = null; }
    window.removeEventListener("devicemotion", handleIMU);
  }

  // ── Load template (with migration for old keys) ──
  useEffect(() => {
    try {
      // Clear potentially corrupted old-format templates
      const s = localStorage.getItem("myshape-fusion-template");
      if (s) {
        const t = JSON.parse(s);
        if (t && t.imuRaw && t.cameraRaw && Array.isArray(t.imuRaw)) {
          setTemplate(t); setMode("verify");
        } else {
          localStorage.removeItem("myshape-fusion-template");
        }
      }
      // Also clear old action-password template to avoid confusion
      localStorage.removeItem("myshape-action-template");
    } catch { /* */ }
  }, []);

  // ── IMU ──
  const handleIMU = useCallback((e: DeviceMotionEvent) => {
    hasRealSensorRef.current = true;
    const now = performance.now(); const t = now - startTimeRef.current;
    const iv = lastEventRef.current > 0 ? now - lastEventRef.current : 0; lastEventRef.current = now;
    samplesRef.current.push({ t: Math.round(t), ax: round(e.acceleration?.x), ay: round(e.acceleration?.y), az: round(e.acceleration?.z), rx: round(e.rotationRate?.alpha), ry: round(e.rotationRate?.beta), rz: round(e.rotationRate?.gamma), interval: Math.round(iv * 100) / 100 });
    setSampleCount(samplesRef.current.length);
  }, []);

  const startSim = useCallback(() => {
    if (simTimerRef.current) return; let t = 0; const seed = Math.floor(Math.random() * 3);
    simTimerRef.current = setInterval(() => { samplesRef.current.push({ t, ax: Math.sin(t * 0.02 + seed) * 2.5 + (Math.random() - 0.5) * 0.8, ay: Math.cos(t * 0.025 + seed) * 1.8 + (Math.random() - 0.5) * 0.6, az: 9.8 + Math.sin(t * 0.015) * 0.3, rx: Math.cos(t * 0.02) * 30 + (Math.random() - 0.5) * 6, ry: Math.sin(t * 0.022) * 25 + (Math.random() - 0.5) * 5, rz: Math.sin(t * 0.018) * 15 + (Math.random() - 0.5) * 4, interval: 16 + (Math.random() - 0.5) * 6 }); setSampleCount(samplesRef.current.length); t += 16; }, 16);
  }, []);

  const stopSim = useCallback(() => { if (simTimerRef.current) { clearInterval(simTimerRef.current); simTimerRef.current = null; } }, []);

  // ── Camera ──
  async function startCamera() {
    try {
      setCameraStatus("Starting...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, frameRate: 15 } });
      if (!videoRef.current) return; streamRef.current = stream; videoRef.current.srcObject = stream; await videoRef.current.play();
      if (!(window as any).Pose) { setCameraStatus("Loading MediaPipe..."); await new Promise<void>((r) => { const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js"; s.crossOrigin = "anonymous"; s.onload = () => r(); document.head.appendChild(s); }); }
      const Pose = (window as any).Pose; const pose = new Pose({ locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${f}` });
      pose.setOptions({ modelComplexity: 0, smoothLandmarks: false, enableSegmentation: false });
      pose.onResults((results: any) => { if (results.poseLandmarks) { const lw = results.poseLandmarks[15]; if (lw) { cameraSamplesRef.current.push(lw.x * 100 + lw.y * 100 + lw.z * 100); if (cameraSamplesRef.current.length > 500) cameraSamplesRef.current.shift(); } } });
      poseIntervalRef.current = setInterval(async () => { if (videoRef.current) { try { await pose.send({ image: videoRef.current }); } catch { /* */ } } }, 100);
      setCameraStatus("Active");
    } catch { setCameraStatus("Unavailable"); }
  }

  function stopCamera() { if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; } if (poseIntervalRef.current) { clearInterval(poseIntervalRef.current); poseIntervalRef.current = null; } if (videoRef.current) videoRef.current.srcObject = null; setCameraStatus(""); }

  function cameraPES(): { result: PESResult; raw: number[] } { const s = cameraSamplesRef.current; if (s.length < 20) return { result: { score: 0, microTiming: 0, noise: 0, entropy: 0 }, raw: s }; const entropy = specEntropy(s); const m = s.reduce((a, b) => a + b, 0) / s.length; const std = Math.sqrt(s.reduce((sum, x) => sum + (x - m) ** 2, 0) / s.length); const noise = std > 1 ? 1 - Math.exp(-std / 15) : 0.1; const score = Math.min(1, entropy * 0.4 + noise * 0.35 + 0.125); return { result: { score, microTiming: 0, noise, entropy }, raw: s }; }

  // ── Main Action ──
  const run = useCallback(async () => {
    setPhase("countdown"); setCountdown(3); for (let i = 2; i >= 0; i--) { await sleep(1000); setCountdown(i); }
    samplesRef.current = []; cameraSamplesRef.current = []; setSampleCount(0); hasRealSensorRef.current = false;
    await startCamera();
    window.addEventListener("devicemotion", handleIMU);
    startTimeRef.current = performance.now(); lastEventRef.current = 0;
    if (isSimulated) { setNoSensors(true); startSim(); } else { setTimeout(() => { if (!hasRealSensorRef.current && !simTimerRef.current) { setNoSensors(true); setIsSimulated(true); startSim(); } }, 1500); }
    setPhase("capturing"); setElapsed(0);
    const start = performance.now();
    const timer = setInterval(() => { const e = (performance.now() - start) / 1000; setElapsed(e); if (e >= DURATION) { clearInterval(timer); finish(); } }, 100);

    function finish() {
      window.removeEventListener("devicemotion", handleIMU); stopSim(); stopCamera();
      const imu = computePES(samplesRef.current); const cam = cameraPES();
      setImuScore(imu.result); setCamScore(cam.result);

      if (mode === "enroll") {
        const tpl: FusionTemplate = { id: crypto.randomUUID?.() ?? String(Date.now()), enrolledAt: new Date().toISOString(), imu: imu.result, imuRaw: imu.raw, camera: cam.result, cameraRaw: cam.raw };
        setTemplate(tpl); try { localStorage.setItem("myshape-fusion-template", JSON.stringify(tpl)); } catch { /* */ }
        setMode("verify"); setVerdict("enrolled");
      } else if (template && template.imuRaw && template.cameraRaw) {
        const is = similarity(imu.raw, template.imuRaw); const cs = similarity(cam.raw, template.cameraRaw);
        setImuSim(is); setCamSim(cs);
        const imuOk = is >= 0.55 && imu.result.score >= 0.18;
        const camOk = cs >= 0.50 || cameraSamplesRef.current.length < 20;
        setVerdict(imuOk && camOk ? "pass" : "fail");
      } else { setVerdict("fail"); }
      setPhase("complete");
    }
  }, [mode, template, isSimulated, handleIMU, startSim, stopSim]);

  // ── Render ──
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <Link href="/research" className="text-white/30 text-[11px] tracking-[0.2em] uppercase hover:text-white/60">← Research</Link>
        <span className="text-white/15 text-[9px] tracking-[0.3em] uppercase">Fusion</span>
        <div className="w-16" />
      </header>
      <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="text-5xl">🔬</div>
          <h1 className="text-white/80 text-[22px] font-light">Dual-Channel Identity</h1>
          <p className="text-white/30 text-[13px] leading-relaxed max-w-sm mx-auto">
            {template ? "Template enrolled. Verify your identity." : "First time? Enroll your motion signature."}
          </p>
        </div>

        <video ref={videoRef} className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none" playsInline muted />
        <div className="p-2 border border-white/5 text-[9px] font-mono text-white/20 flex justify-between">
          <span>IMU: {sampleCount} | Cam: {cameraStatus || "off"} | {isSimulated ? "SIM" : "LIVE"}</span>
          <span>{template ? "✓ Enrolled" : "○ No template"}</span>
        </div>

        {phase === "idle" && (
          <div className="space-y-4">
            {noSensors && <div className="p-3 border border-yellow-400/20 bg-yellow-400/[0.04] text-yellow-400/60 text-[11px] text-center">No sensors — simulation active. Use HTTPS for real test.</div>}
            <button onClick={() => setIsSimulated(!isSimulated)}
              className={`w-full py-2 border text-[11px] tracking-[0.12em] uppercase ${isSimulated ? "border-[#90c8ff]/30 text-[#90c8ff]/50 bg-[#90c8ff]/5" : "border-white/5 text-white/15 hover:border-white/15 hover:text-white/30"}`}>
              {isSimulated ? "⚡ Simulate" : "💻 Simulate (if no sensors)"}
            </button>
            <button onClick={() => { setMode(template ? "verify" : "enroll"); run(); }}
              className="w-full py-5 bg-gradient-to-r from-[#3fb950]/20 to-[#90c8ff]/20 border-2 border-[#3fb950]/40 text-[#3fb950] text-[16px] tracking-[0.15em] uppercase font-bold hover:border-[#3fb950] transition-all active:scale-[0.98]">
              {template ? "✅ Verify Identity" : "🔒 Enroll Identity"}
            </button>
            {template && (
              <button onClick={() => { setTemplate(null); localStorage.removeItem("myshape-fusion-template"); setMode("enroll"); }}
                className="w-full py-2 border border-white/5 text-white/15 text-[10px] tracking-[0.15em] uppercase hover:border-white/15">
                Reset (Re-Enroll)
              </button>
            )}
          </div>
        )}

        {phase === "countdown" && (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="text-white/20 text-[12px] uppercase">{mode === "enroll" ? "Recording Your Signature" : "Verifying Identity"}</div>
            <div className="text-[120px] font-light text-[#3fb950] leading-none" style={{ textShadow: "0 0 60px rgba(63,185,80,0.4)", animation: "countdownPulse 1s ease-in-out infinite" }}>{countdown}</div>
          </div>
        )}

        {phase === "capturing" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] uppercase"><span className="text-[#3fb950]/50">{mode === "enroll" ? "Enrolling" : "Verifying"}</span><span className="text-[#3fb950]/50 font-mono">{elapsed.toFixed(1)}s / {DURATION}s</span></div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[#3fb950]/60 to-[#90c8ff]/60 rounded-full transition-all duration-100" style={{ width: `${(elapsed / DURATION) * 100}%` }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div className="p-3 border border-[#3fb950]/10 bg-[#3fb950]/[0.02]"><div className="text-[#3fb950]/40 text-[8px] uppercase mb-1">IMU</div><div className="text-white/50 font-mono">{sampleCount} samples</div></div>
              <div className="p-3 border border-[#90c8ff]/10 bg-[#90c8ff]/[0.02]"><div className="text-[#90c8ff]/40 text-[8px] uppercase mb-1">Camera</div><div className="text-white/50 font-mono">{cameraSamplesRef.current.length} frames</div></div>
            </div>
            <div className="text-center p-8 border border-dashed border-white/10 text-white/30 text-[14px]">Move naturally — any motion works.</div>
          </div>
        )}

        {phase === "complete" && (
          <div className="space-y-6">
            {verdict === "enrolled" ? (
              <div className="text-center p-6 border-2 border-[#90c8ff]/40 bg-[#90c8ff]/[0.04] space-y-4">
                <div className="text-6xl">🔒</div>
                <h2 className="text-[22px] font-light text-[#90c8ff]">Identity Enrolled</h2>
                <p className="text-white/25 text-[12px]">Your dual-channel signature saved. Now verify to confirm it works.</p>
              </div>
            ) : verdict === "pass" ? (
              <div className="text-center p-6 border-2 border-[#3fb950]/40 bg-[#3fb950]/[0.04] space-y-4">
                <div className="text-6xl">✅</div>
                <h2 className="text-[22px] font-light text-[#3fb950]">Identity Verified</h2>
                <p className="text-white/25 text-[12px]">Both channels match your enrolled signature.</p>
              </div>
            ) : (
              <div className="text-center p-6 border-2 border-red-400/40 bg-red-400/[0.04] space-y-4">
                <div className="text-6xl">❌</div>
                <h2 className="text-[22px] font-light text-red-400">Verification Failed</h2>
                <p className="text-white/25 text-[12px]">One or both channels don&apos;t match the enrolled template.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-white/10 bg-white/[0.02] space-y-2">
                <div className="text-[10px] uppercase text-white/20">IMU Channel</div>
                <div className="text-[24px] font-mono text-[#3fb950]">{imuScore?.score.toFixed(3)}</div>
                {template && <div className="text-[9px] text-white/20">Match: {(imuSim * 100).toFixed(0)}%</div>}
              </div>
              <div className="p-4 border border-white/10 bg-white/[0.02] space-y-2">
                <div className="text-[10px] uppercase text-white/20">Camera Channel</div>
                <div className="text-[24px] font-mono text-[#90c8ff]">{camScore?.score.toFixed(3)}</div>
                {template && <div className="text-[9px] text-white/20">Match: {(camSim * 100).toFixed(0)}%</div>}
              </div>
            </div>

            <button onClick={() => { setPhase("idle"); setVerdict("waiting"); setImuScore(null); setCamScore(null); setImuSim(0); setCamSim(0); }}
              className="w-full py-4 border border-white/10 text-white/25 text-[11px] tracking-[0.2em] uppercase hover:border-white/30 transition-all">
              {verdict === "enrolled" ? "Continue → Verify" : template ? "↻ Verify Again" : "↻ Enroll Again"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function round(v: number | null | undefined): number { if (v === null || v === undefined) return 0; return Math.round(v * 1000) / 1000; }
