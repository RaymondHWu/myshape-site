"use client";
import { useRef, useState } from "react";

export default function CameraTest() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Click Start");
  const [error, setError] = useState("");

  async function test() {
    setStatus("Testing...");
    setError("");

    // Step 1: list devices
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((d) => d.kind === "videoinput");
      setStatus(`Found ${cameras.length} camera(s): ${cameras.map((c) => c.label || "(no label)").join(", ")}`);
      if (cameras.length === 0) {
        setError("NO CAMERA FOUND. Check Windows Settings > Privacy & Security > Camera.");
        return;
      }
    } catch (e: unknown) {
      setError(`enumerateDevices failed: ${e}`);
      return;
    }

    // Step 2: try simplest getUserMedia
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("SUCCESS - camera works!");
    } catch (e: unknown) {
      const msg = e instanceof DOMException ? `${e.name}: ${e.message}` : String(e);
      setError(msg);
      setStatus("FAILED — see fix instructions below");
      return;
    }
  }

  return (
    <div style={{ background: "#0a0a0f", color: "white", minHeight: "100vh", padding: 40, fontFamily: "monospace" }}>
      <h1>Camera Test</h1>
      <p style={{ color: "#90c8ff" }}>{status}</p>
      {error && (
        <div style={{ color: "#f56565", marginTop: 16 }}>
          <p>{error}</p>
          <div style={{ background: "#1a1a2e", padding: 20, borderRadius: 8, marginTop: 16, color: "#e0e0e0", fontSize: 14, lineHeight: 2 }}>
            <strong style={{ color: "#ffd700" }}>How to fix:</strong><br/>
            1. Press <b>Windows key</b>, type <b>"Camera privacy"</b>, press Enter<br/>
            2. Make sure <b>"Allow apps to access your camera"</b> is <span style={{ color: "#48bb78" }}>ON</span><br/>
            3. Make sure <b>"Allow desktop apps to access your camera"</b> is <span style={{ color: "#48bb78" }}>ON</span><br/>
            4. <b>Close all browser windows completely</b>, then reopen<br/>
            5. Come back to this page and test again<br/>
            <br/>
            <span style={{ color: "#90c8ff" }}>
              {"→"} The second toggle ("desktop apps") is often turned OFF
              even when the first one is ON. That blocks all browsers.
            </span>
          </div>
        </div>
      )}
      <button onClick={test} style={{ padding: "12px 24px", margin: "16px 0", cursor: "pointer", background: "#90c8ff", color: "#0a0a0f", border: "none", borderRadius: 6, fontSize: 16 }}>Start Test</button>
      <video ref={videoRef} autoPlay playsInline style={{ width: 320, border: "1px solid #333", display: "block" }} />
    </div>
  );
}
