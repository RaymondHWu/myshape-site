"use client";

// ── Shared AudioContext ──
// Keep-alive on every user gesture ensures the context is unlocked.
// We NEVER synchronously check ctx.state because resume() is async
// and the state check would race with the pending resume promise.
// Instead: fire resume(), then immediately schedule the oscillator.
// The browser's audio thread handles ordering correctly.

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!_ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    _ctx = new AC();
  }
  return _ctx;
}

// Keep-alive: aggressively resume on every interaction
if (typeof window !== "undefined") {
  const resume = () => {
    const ctx = getCtx();
    if (ctx) ctx.resume().catch(() => {});
  };
  ["click", "touchstart", "keydown", "pointerdown", "mouseenter"].forEach((evt) =>
    document.addEventListener(evt, resume, { passive: true, capture: true }),
  );
}

export function resumeAudio(): void {
  const ctx = getCtx();
  if (ctx) ctx.resume().catch(() => {});
}

export function playTick(
  freq = 800,
  type: OscillatorType = "triangle",
  duration = 0.04,
  vol = 0.012,
) {
  if (typeof window === "undefined") return;
  const ctx = getCtx();
  if (!ctx) return;

  // Fire resume (no await — the audio thread queues this before our oscillator)
  ctx.resume().catch(() => {});

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(Math.min(vol, 0.05), ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  } catch {
    // audio is non-critical
  }
}
