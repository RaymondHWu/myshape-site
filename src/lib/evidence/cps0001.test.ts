import { describe, it, expect } from "vitest";
import {
  createReceiptId,
  computePayloadDigest,
  buildAssertions,
  buildReceipt,
  verifySchema,
  verifyAssertions,
  verifyTemporal,
  verifyEvidenceIntegrity,
  verifyFreshness,
  verifyReceipt,
  signReceipt,
  engineEvidenceToBlock,
  type ContinuityReceipt,
  type EvidenceBlock,
  type ContinuityInterval,
  type SubjectRef,
  type IssuerIdentity,
} from "./cps0001";
import type { EngineEvidence } from "./types";
import { generateKeyPair, createIssuerIdentity } from "@/lib/crypto";

// ── Helpers ──

const TEST_KEYPAIR = generateKeyPair();
const TEST_ISSUER = createIssuerIdentity(TEST_KEYPAIR);

function makeBlock(overrides?: Partial<EvidenceBlock>): EvidenceBlock {
  return {
    engineId: "EE-001",
    engineVersion: "1.2.0",
    confidence: 0.85,
    payload: { entropyScore: 0.72 },
    payloadDigest: "",
    ...overrides,
  };
}

function makeInterval(overrides?: Partial<ContinuityInterval>): ContinuityInterval {
  const start = new Date(Date.now() - 60000);
  const end = new Date(Date.now() - 52000);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    coverageMs: 8000,
    ...overrides,
  };
}

function makeSubject(overrides?: Partial<SubjectRef>): SubjectRef {
  return { id: "sha256:abcd1234...", type: "embodied", ...overrides };
}

function makeIssuer(overrides?: Partial<IssuerIdentity>): IssuerIdentity {
  return { ...TEST_ISSUER, ...overrides };
}

/** Build a valid signed receipt for testing. */
function makeSignedReceipt(overrides: Partial<Omit<ContinuityReceipt, "signature">> = {}): ContinuityReceipt {
  const block = makeBlock();
  block.payloadDigest = computePayloadDigest(block.payload);

  const unsigned = buildReceipt({
    evidence: [block],
    interval: makeInterval(),
    subject: makeSubject(),
    issuer: makeIssuer(),
    ...overrides,
  });

  return signReceipt(unsigned, TEST_KEYPAIR.secretKey);
}

// ═══════════════════════════════════════════
// createReceiptId
// ═══════════════════════════════════════════

describe("createReceiptId", () => {
  it("returns a UUIDv7-like string", () => {
    const id = createReceiptId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("produces unique IDs on successive calls", () => {
    const ids = new Set(Array.from({ length: 100 }, () => createReceiptId()));
    expect(ids.size).toBe(100);
  });
});

// ═══════════════════════════════════════════
// computePayloadDigest
// ═══════════════════════════════════════════

describe("computePayloadDigest", () => {
  it("returns a 64-char hex string", async () => {
    const digest = computePayloadDigest({ key: "value" });
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic — same payload → same digest", () => {
    const p = { a: 1, b: "test" };
    expect(computePayloadDigest(p)).toBe(computePayloadDigest(p));
  });

  it("produces different digests for different payloads", () => {
    const d1 = computePayloadDigest({ x: 1 });
    const d2 = computePayloadDigest({ x: 2 });
    expect(d1).not.toBe(d2);
  });
});

// ═══════════════════════════════════════════
// buildAssertions
// ═══════════════════════════════════════════

describe("buildAssertions", () => {
  it("returns observation=true + continuity=true when confidence high", () => {
    const a = buildAssertions([0.9, 0.85]);
    expect(a.observationOccurred.value).toBe(true);
    expect(a.continuityMaintained.value).toBe(true);
    expect(a.continuityMaintained.confidence).toBeCloseTo(0.875);
  });

  it("returns observation=true + continuity=false when confidence low", () => {
    const a = buildAssertions([0.3, 0.2]);
    expect(a.observationOccurred.value).toBe(true);
    expect(a.continuityMaintained.value).toBe(false);
  });

  it("returns observation=false when no engines", () => {
    const a = buildAssertions([]);
    expect(a.observationOccurred.value).toBe(false);
    expect(a.continuityMaintained.value).toBe(false);
    expect(a.continuityMaintained.confidence).toBe(0);
  });

  it("receiptIntegrity is always true with confidence 1.0", () => {
    const a = buildAssertions([0.5]);
    expect(a.receiptIntegrity.value).toBe(true);
    expect(a.receiptIntegrity.confidence).toBe(1.0);
  });
});

// ═══════════════════════════════════════════
// buildReceipt
// ═══════════════════════════════════════════

describe("buildReceipt", () => {
  it("produces a well-formed receipt (without signature)", () => {
    const block = makeBlock();
    block.payloadDigest = computePayloadDigest(block.payload);

    const receipt = buildReceipt({
      evidence: [block],
      interval: makeInterval(),
      subject: makeSubject(),
      issuer: makeIssuer(),
    });

    expect(receipt.protocolVersion).toBe("1.0");
    expect(receipt.receiptId).toMatch(/^[0-9a-f-]{36}$/);
    expect(receipt.interval.coverageMs).toBe(8000);
    expect(receipt.subject.id).toBe("sha256:abcd1234...");
    expect(receipt.evidence).toHaveLength(1);
    expect(receipt.assertions.continuityMaintained.confidence).toBe(0.85);
    expect(receipt.previousReceiptHash).toBeNull();
    expect(receipt.references).toEqual([]);
    expect(receipt.expiresAt).toBeDefined();
  });

  it("chains to previous receipt when hash provided", () => {
    const receipt = buildReceipt({
      evidence: [],
      interval: makeInterval(),
      subject: makeSubject(),
      issuer: makeIssuer(),
      previousReceiptHash: "sha256:prev...",
    });
    expect(receipt.previousReceiptHash).toBe("sha256:prev...");
  });

  it("sets verdict when provided", () => {
    const receipt = buildReceipt({
      evidence: [],
      interval: makeInterval(),
      subject: makeSubject(),
      issuer: makeIssuer(),
      verdict: "PASS",
    });
    expect(receipt.verdict).toBe("PASS");
  });
});

// ═══════════════════════════════════════════
// verifySchema (V₁)
// ═══════════════════════════════════════════

describe("verifySchema (V₁)", () => {
  it("returns null for a valid receipt", () => {
    const r = buildReceipt({
      evidence: [],
      interval: makeInterval(),
      subject: makeSubject(),
      issuer: makeIssuer(),
    }) as ContinuityReceipt;
    // Add signature for full validity
    r.signature = { algorithm: "Ed25519", value: "sig...", signedAt: r.interval.end };
    expect(verifySchema(r)).toBeNull();
  });

  it("rejects wrong protocol version", () => {
    const r = buildReceipt({
      evidence: [],
      interval: makeInterval(),
      subject: makeSubject(),
      issuer: makeIssuer(),
    }) as ContinuityReceipt;
    r.signature = { algorithm: "Ed25519", value: "sig", signedAt: r.interval.end };
    r.protocolVersion = "0.9";
    expect(verifySchema(r)).toBe("INVALID_SCHEMA");
  });

  it("rejects missing subject.id", () => {
    const r = buildReceipt({
      evidence: [],
      interval: makeInterval(),
      subject: { id: "" },
      issuer: makeIssuer(),
    }) as ContinuityReceipt;
    r.signature = { algorithm: "Ed25519", value: "sig", signedAt: r.interval.end };
    expect(verifySchema(r)).toBe("INVALID_SCHEMA");
  });

  it("rejects missing issuer", () => {
    const r = buildReceipt({
      evidence: [],
      interval: makeInterval(),
      subject: makeSubject(),
      issuer: { id: "", publicKey: "" },
    }) as ContinuityReceipt;
    r.signature = { algorithm: "Ed25519", value: "sig", signedAt: r.interval.end };
    expect(verifySchema(r)).toBe("INVALID_SCHEMA");
  });
});

// ═══════════════════════════════════════════
// verifyAssertions (V₃)
// ═══════════════════════════════════════════

describe("verifyAssertions (V₃)", () => {
  it("passes when continuity=false (no contradiction)", () => {
    const a = buildAssertions([0.2]);
    const r = buildReceipt({
      evidence: [],
      interval: makeInterval(),
      subject: makeSubject(),
      issuer: makeIssuer(),
    }) as ContinuityReceipt;
    r.signature = { algorithm: "Ed25519", value: "sig", signedAt: r.interval.end };
    r.assertions = a;
    expect(verifyAssertions(r)).toBeNull();
  });

  it("passes when continuity=true and observation=true", () => {
    const a = buildAssertions([0.9]);
    const r = buildReceipt({
      evidence: [],
      interval: makeInterval(),
      subject: makeSubject(),
      issuer: makeIssuer(),
    }) as ContinuityReceipt;
    r.signature = { algorithm: "Ed25519", value: "sig", signedAt: r.interval.end };
    r.assertions = a;
    expect(verifyAssertions(r)).toBeNull();
  });

  it("rejects continuity=true without observation", () => {
    const r = buildReceipt({
      evidence: [],
      interval: makeInterval(),
      subject: makeSubject(),
      issuer: makeIssuer(),
    }) as ContinuityReceipt;
    r.signature = { algorithm: "Ed25519", value: "sig", signedAt: r.interval.end };
    r.assertions = {
      observationOccurred: { value: false, confidence: 0 },
      continuityMaintained: { value: true, confidence: 0.9 },
      receiptIntegrity: { value: true, confidence: 1.0 },
    };
    expect(verifyAssertions(r)).toBe("INCONSISTENT_ASSERTIONS");
  });
});

// ═══════════════════════════════════════════
// verifyTemporal (V₄)
// ═══════════════════════════════════════════

describe("verifyTemporal (V₄)", () => {
  it("passes for a valid interval", () => {
    const r = buildReceipt({
      evidence: [],
      interval: makeInterval(),
      subject: makeSubject(),
      issuer: makeIssuer(),
    }) as ContinuityReceipt;
    r.signature = { algorithm: "Ed25519", value: "sig", signedAt: r.interval.end };
    expect(verifyTemporal(r)).toBeNull();
  });

  it("rejects start >= end", () => {
    const r = buildReceipt({
      evidence: [],
      interval: makeInterval({ start: "2026-07-22T10:00:09.000Z", end: "2026-07-22T10:00:08.000Z", coverageMs: 8000 }),
      subject: makeSubject(),
      issuer: makeIssuer(),
    }) as ContinuityReceipt;
    r.signature = { algorithm: "Ed25519", value: "sig", signedAt: r.interval.end };
    expect(verifyTemporal(r)).toBe("TEMPORAL_INCONSISTENCY");
  });

  it("rejects coverageMs mismatch", () => {
    const r = buildReceipt({
      evidence: [],
      interval: makeInterval({ coverageMs: 9999 }),
      subject: makeSubject(),
      issuer: makeIssuer(),
    }) as ContinuityReceipt;
    r.signature = { algorithm: "Ed25519", value: "sig", signedAt: r.interval.end };
    expect(verifyTemporal(r)).toBe("TEMPORAL_INCONSISTENCY");
  });

  it("rejects signedAt before interval.end", () => {
    const r = buildReceipt({
      evidence: [],
      interval: makeInterval(),
      subject: makeSubject(),
      issuer: makeIssuer(),
    }) as ContinuityReceipt;
    r.signature = { algorithm: "Ed25519", value: "sig", signedAt: "2026-07-22T10:00:07.000Z" }; // before end
    expect(verifyTemporal(r)).toBe("TEMPORAL_INCONSISTENCY");
  });
});

// ═══════════════════════════════════════════
// verifyEvidenceIntegrity (V₅)
// ═══════════════════════════════════════════

describe("verifyEvidenceIntegrity (V₅)", () => {
  it("passes when payloadDigest matches", () => {
    const payload = { entropy: 0.72 };
    const digest = computePayloadDigest(payload);
    const r = buildReceipt({
      evidence: [{ engineId: "EE-001", engineVersion: "1.0", confidence: 0.8, payload, payloadDigest: digest }],
      interval: makeInterval(),
      subject: makeSubject(),
      issuer: makeIssuer(),
    }) as ContinuityReceipt;
    r.signature = { algorithm: "Ed25519", value: "sig", signedAt: r.interval.end };
    expect(verifyEvidenceIntegrity(r)).toBeNull();
  });

  it("rejects tampered payload", () => {
    const payload = { entropy: 0.72 };
    const digest = computePayloadDigest(payload);
    const r = buildReceipt({
      evidence: [{ engineId: "EE-001", engineVersion: "1.0", confidence: 0.8, payload: { entropy: 0.99 }, payloadDigest: digest }],
      interval: makeInterval(),
      subject: makeSubject(),
      issuer: makeIssuer(),
    }) as ContinuityReceipt;
    r.signature = { algorithm: "Ed25519", value: "sig", signedAt: r.interval.end };
    expect(verifyEvidenceIntegrity(r)).toBe("EVIDENCE_TAMPERED");
  });
});

// ═══════════════════════════════════════════
// verifyFreshness (V₆)
// ═══════════════════════════════════════════

describe("verifyFreshness (V₆)", () => {
  it("passes when not expired", () => {
    const future = new Date(Date.now() + 3600_000).toISOString();
    const r = buildReceipt({
      evidence: [],
      interval: makeInterval(),
      subject: makeSubject(),
      issuer: makeIssuer(),
    }) as ContinuityReceipt;
    r.signature = { algorithm: "Ed25519", value: "sig", signedAt: r.interval.end };
    r.expiresAt = future;
    expect(verifyFreshness(r)).toBeNull();
  });

  it("rejects expired receipt", () => {
    const past = new Date(Date.now() - 3600_000).toISOString();
    const r = buildReceipt({
      evidence: [],
      interval: makeInterval(),
      subject: makeSubject(),
      issuer: makeIssuer(),
    }) as ContinuityReceipt;
    r.signature = { algorithm: "Ed25519", value: "sig", signedAt: r.interval.end };
    r.expiresAt = past;
    expect(verifyFreshness(r)).toBe("EXPIRED");
  });

  it("passes when expiresAt is undefined", () => {
    const r = buildReceipt({
      evidence: [],
      interval: makeInterval(),
      subject: makeSubject(),
      issuer: makeIssuer(),
    }) as ContinuityReceipt;
    r.signature = { algorithm: "Ed25519", value: "sig", signedAt: r.interval.end };
    r.expiresAt = undefined;
    expect(verifyFreshness(r)).toBeNull();
  });
});

// ═══════════════════════════════════════════
// verifyReceipt (integration)
// ═══════════════════════════════════════════

describe("verifyReceipt (V₁–V₆ integration)", () => {
  it("returns VALID for a well-formed receipt", () => {
    const r = makeSignedReceipt();

    const result = verifyReceipt(r);
    expect(result.status).toBe("VALID");
  });

  it("returns INVALID with correct reason for schema violation", () => {
    const r = makeSignedReceipt();
    // Override after signing (signature covers original fields, but schema check runs first)
    const tampered = { ...r, protocolVersion: "0.5" } as ContinuityReceipt;

    const result = verifyReceipt(tampered);
    expect(result.status).toBe("INVALID");
    if (result.status === "INVALID") expect(result.reason).toBe("INVALID_SCHEMA");
  });

  it("returns INVALID for tampered evidence", () => {
    const r = makeSignedReceipt();
    // Tamper with evidence payload after signing
    const tampered = {
      ...r,
      evidence: [{ ...r.evidence[0], payload: { entropy: 0.01 } }],
    } as ContinuityReceipt;

    const result = verifyReceipt(tampered);
    expect(result.status).toBe("INVALID");
    if (result.status === "INVALID") expect(result.reason).toBe("EVIDENCE_TAMPERED");
  });

  it("returns INVALID for forged signature", () => {
    const r = makeSignedReceipt();
    const forged = {
      ...r,
      issuer: { ...r.issuer, publicKey: "00".repeat(32) }, // wrong public key
    } as ContinuityReceipt;

    const result = verifyReceipt(forged);
    expect(result.status).toBe("INVALID");
    if (result.status === "INVALID") expect(result.reason).toBe("INVALID_SIGNATURE");
  });
});

// ═══════════════════════════════════════════
// engineEvidenceToBlock
// ═══════════════════════════════════════════

describe("engineEvidenceToBlock", () => {
  it("converts EngineEvidence to EvidenceBlock", () => {
    const ee: EngineEvidence = {
      engineId: "EE-001",
      timestamp: "2026-07-22T10:00:00.000Z",
      components: [
        { engine: "EE-001", metric: "IMU_PES", value: 0.72, threshold: 0.5, status: "PASS", explanation: "Good entropy" },
      ],
      diagnostics: ["Sensor stable"],
      confidence: 0.85,
      evidenceDigest: "old-digest",
    };

    const block = engineEvidenceToBlock(ee);

    expect(block.engineId).toBe("EE-001");
    expect(block.engineVersion).toBe("1.0.0");
    expect(block.confidence).toBe(0.85);
    expect(block.payload.components).toHaveLength(1);
    expect(block.payload.diagnostics).toEqual(["Sensor stable"]);
    expect(block.payloadDigest).toMatch(/^[0-9a-f]{64}$/);
  });

  it("uses custom engine version", () => {
    const ee: EngineEvidence = {
      engineId: "EE-003",
      timestamp: "t",
      components: [],
      diagnostics: [],
      confidence: 0.5,
    };

    const block = engineEvidenceToBlock(ee, "2.1.0");
    expect(block.engineVersion).toBe("2.1.0");
  });

  it("payloadDigest matches payload content", () => {
    const ee: EngineEvidence = {
      engineId: "EE-001",
      timestamp: "t",
      components: [{ engine: "EE-001", metric: "M", value: 1, threshold: 0.5, status: "PASS", explanation: "x" }],
      diagnostics: ["d"],
      confidence: 1.0,
    };

    const block = engineEvidenceToBlock(ee);
    const expected = computePayloadDigest(block.payload);
    expect(block.payloadDigest).toBe(expected);
  });
});
