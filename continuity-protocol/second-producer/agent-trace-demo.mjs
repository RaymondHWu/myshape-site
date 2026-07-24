/**
 * EE-002 Agent Trace Demo
 *
 * Simulates an AI agent running for 60 seconds, producing a
 * signed CPS-0001 Continuity Receipt verified by the CLI.
 *
 * Zero MyShape dependencies. Run:
 *   node continuity-protocol/second-producer/agent-trace-demo.mjs
 */

import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { ed25519 } from "@noble/curves/ed25519.js";
import { analyzeTrace } from "./agent-trace-engine.ts";

function sha256Hex(data) {
  return bytesToHex(sha256(new TextEncoder().encode(data)));
}

// ── Step 1: Generate 60s simulated agent trace ──

const snapshots = [];
const startTime = Date.now();
const baseMemory = 512;
for (let i = 0; i < 60; i++) {
  snapshots.push({
    timestamp: startTime + i * 1000 + Math.floor((Math.random() - 0.5) * 200), // ±100ms jitter
    processCount: 12 + Math.floor(Math.random() * 3),
    memoryMB: baseMemory + Math.sin(i * 0.1) * 20 + (Math.random() - 0.5) * 10,
    cpuPercent: 15 + Math.random() * 25,
  });
}

// ── Step 2: Run Engine ──

const { analysis, evidence } = analyzeTrace(snapshots);
console.log("");
console.log("═══════════════════════════════════════════");
console.log("  EE-002 Agent Execution Trace Engine");
console.log("═══════════════════════════════════════════");
console.log("");
console.log(`  Snapshots    : ${analysis.totalSnapshots}`);
console.log(`  Duration     : ${snapshots[snapshots.length - 1].timestamp - snapshots[0].timestamp}ms`);
console.log(`  Avg Interval : ${analysis.avgIntervalMs}ms`);
console.log(`  Temporal     : ${(analysis.temporalDensity * 100).toFixed(0)}%`);
console.log(`  Stability    : ${(analysis.valueStability * 100).toFixed(0)}%`);
console.log(`  Coverage     : ${(analysis.coverageScore * 100).toFixed(0)}%`);
console.log(`  Confidence   : ${evidence.confidence}`);

// ── Step 3: Build ContinuityReceipt ──

const sk = ed25519.utils.randomSecretKey();
const pk = ed25519.getPublicKey(sk);
const issuer = { id: sha256Hex(bytesToHex(pk)).slice(0, 16), publicKey: bytesToHex(pk) };

const now = new Date();
const unsigned = {
  protocolVersion: "1.0",
  receiptId: (() => {
    const ts = Date.now().toString(16).padStart(12, "0");
    const r = bytesToHex(ed25519.utils.randomSecretKey()).slice(0, 20);
    const hex = (ts + r).slice(0, 32).padEnd(32, "0");
    return [hex.slice(0, 8), hex.slice(8, 12), "7" + hex.slice(13, 16), "8" + hex.slice(16, 19), hex.slice(19, 31)].join("-");
  })(),
  interval: { start: new Date(startTime).toISOString(), end: new Date(startTime + 60000).toISOString(), coverageMs: 60000 },
  subject: { id: sha256Hex("agent-runner-001"), type: "agent" },
  evidence: [evidence],
  assertions: {
    observationOccurred: { value: true, confidence: 0.95 },
    continuityMaintained: { value: evidence.confidence >= 0.5, confidence: evidence.confidence },
    receiptIntegrity: { value: true, confidence: 1.0 },
  },
  issuer,
  previousReceiptHash: null,
  references: [],
  expiresAt: new Date(now.getTime() + 3600_000).toISOString(),
};

// ── Step 4: Sign ──

const signPayload = [
  unsigned.receiptId, unsigned.interval.start, unsigned.interval.end,
  String(unsigned.interval.coverageMs), unsigned.subject.id,
  evidence.payloadDigest, unsigned.issuer.id, unsigned.issuer.publicKey,
].join(":");
const sig = ed25519.sign(new TextEncoder().encode(signPayload), sk);
const receipt = { ...unsigned, signature: { algorithm: "Ed25519", value: bytesToHex(sig), signedAt: new Date(startTime + 61000).toISOString() } };

// ── Step 5: Save ──

import { writeFileSync } from "fs";
const outPath = "continuity-protocol/test-vectors/generated/agent-trace.json";
import { mkdirSync } from "fs";
try { mkdirSync("continuity-protocol/test-vectors/generated", { recursive: true }); } catch {}
writeFileSync(outPath, JSON.stringify(receipt, null, 2));
console.log(`\n  Receipt saved: ${outPath}`);
console.log(`  Verify:  node continuity-protocol/cli/bin/cps-verify.mjs ${outPath}`);
console.log("\n═══════════════════════════════════════════\n");
