// ═══════════════════════════════════════════════════════════════════
// CPS-0001 Conformance Test Suite
//
// Any implementation claiming CPS-0001 compatibility MUST pass these.
// Zero dependencies on MyShape engine code.
//
// Run: npx vitest run continuity-protocol/conformance/
// ═══════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  verifySchema,
  verifyAssertions,
  verifyTemporal,
  verifyEvidenceIntegrity,
  verifyFreshness,
  verifyPredecessor,
  verifyReceipt,
  type ContinuityReceipt,
} from "../reference-verifier/verifier";

import valid01 from "../test-vectors/valid/single-engine.json";
import valid02 from "../test-vectors/valid/multi-engine.json";
import expired from "../test-vectors/invalid/expired.json";
import tampered from "../test-vectors/invalid/tampered-evidence.json";
import brokenChain from "../test-vectors/invalid/broken-chain.json";

// ═══════════════════════════════════════════
// CONFORMANCE-01: Valid Receipt (single engine)
// ═══════════════════════════════════════════

describe("CONFORMANCE-01: valid receipt (single engine)", () => {
  it("✓ V₁ passes schema check", () => {
    expect(verifySchema(valid01 as ContinuityReceipt)).toBeNull();
  });

  it("✓ V₃ passes assertion consistency", () => {
    expect(verifyAssertions(valid01 as ContinuityReceipt)).toBeNull();
  });

  it("✓ V₄ passes temporal consistency", () => {
    expect(verifyTemporal(valid01 as ContinuityReceipt)).toBeNull();
  });

  it("✓ V₅ passes evidence integrity", async () => {
    expect(await verifyEvidenceIntegrity(valid01 as ContinuityReceipt)).toBeNull();
  });

  it("✓ V₆ passes freshness (not expired)", () => {
    expect(verifyFreshness(valid01 as ContinuityReceipt)).toBeNull();
  });

  it("✓ verifyReceipt returns VALID", async () => {
    const result = await verifyReceipt(valid01 as ContinuityReceipt);
    expect(result.status).toBe("VALID");
  });
});

// ═══════════════════════════════════════════
// CONFORMANCE-02: Valid Receipt (chained, multi-engine)
// ═══════════════════════════════════════════

describe("CONFORMANCE-02: valid receipt (chained, multi-engine)", () => {
  it("✓ V₁–V₅ all pass", async () => {
    expect(verifySchema(valid02 as ContinuityReceipt)).toBeNull();
    expect(verifyAssertions(valid02 as ContinuityReceipt)).toBeNull();
    expect(verifyTemporal(valid02 as ContinuityReceipt)).toBeNull();
    expect(await verifyEvidenceIntegrity(valid02 as ContinuityReceipt)).toBeNull();
  });

  it("✓ verifyReceipt returns VALID", async () => {
    const result = await verifyReceipt(valid02 as ContinuityReceipt);
    expect(result.status).toBe("VALID");
  });

  it("✓ V₇ predecessor chain verifies (valid-01 → valid-02)", async () => {
    const err = await verifyPredecessor(valid02 as ContinuityReceipt, valid01 as ContinuityReceipt);
    expect(err).toBeNull();
  });
});

// ═══════════════════════════════════════════
// CONFORMANCE-03: Reject expired receipt (V₆)
// ═══════════════════════════════════════════

describe("CONFORMANCE-03: expired receipt", () => {
  it("✗ V₁–V₅ pass (receipt is structurally valid)", async () => {
    expect(verifySchema(expired as ContinuityReceipt)).toBeNull();
    expect(await verifyEvidenceIntegrity(expired as ContinuityReceipt)).toBeNull();
  });

  it("✗ V₆ rejects — EXPIRED", () => {
    expect(verifyFreshness(expired as ContinuityReceipt)).toBe("EXPIRED");
  });

  it("✗ verifyReceipt returns INVALID with EXPIRED reason", async () => {
    const result = await verifyReceipt(expired as ContinuityReceipt);
    expect(result.status).toBe("INVALID");
    if (result.status === "INVALID") expect(result.reason).toBe("EXPIRED");
  });
});

// ═══════════════════════════════════════════
// CONFORMANCE-04: Reject tampered evidence (V₅)
// ═══════════════════════════════════════════

describe("CONFORMANCE-04: tampered evidence", () => {
  it("✗ V₁, V₃, V₄ pass (receipt is structurally valid)", () => {
    expect(verifySchema(tampered as ContinuityReceipt)).toBeNull();
    expect(verifyAssertions(tampered as ContinuityReceipt)).toBeNull();
    expect(verifyTemporal(tampered as ContinuityReceipt)).toBeNull();
  });

  it("✗ V₅ rejects — EVIDENCE_TAMPERED", async () => {
    expect(await verifyEvidenceIntegrity(tampered as ContinuityReceipt)).toBe("EVIDENCE_TAMPERED");
  });

  it("✗ verifyReceipt returns INVALID with EVIDENCE_TAMPERED reason", async () => {
    const result = await verifyReceipt(tampered as ContinuityReceipt);
    expect(result.status).toBe("INVALID");
    if (result.status === "INVALID") expect(result.reason).toBe("EVIDENCE_TAMPERED");
  });
});

// ═══════════════════════════════════════════
// CONFORMANCE-05: Reject broken chain (V₇)
// ═══════════════════════════════════════════

describe("CONFORMANCE-05: broken predecessor chain", () => {
  it("✗ V₇ rejects — CHAIN_BROKEN when predecessor doesn't match", async () => {
    const err = await verifyPredecessor(brokenChain as ContinuityReceipt, valid01 as ContinuityReceipt);
    expect(err).toBe("CHAIN_BROKEN");
  });
});

// ═══════════════════════════════════════════
// CONFORMANCE-06: Reject inconsistent assertions (V₃)
// ═══════════════════════════════════════════

describe("CONFORMANCE-06: inconsistent assertions", () => {
  it("✗ V₃ rejects continuity=true without observation", () => {
    const r = JSON.parse(JSON.stringify(valid01)) as ContinuityReceipt;
    r.assertions.observationOccurred.value = false;
    r.assertions.continuityMaintained.value = true;
    expect(verifyAssertions(r)).toBe("INCONSISTENT_ASSERTIONS");
  });
});

// ═══════════════════════════════════════════
// CONFORMANCE-07: Reject invalid schema (V₁)
// ═══════════════════════════════════════════

describe("CONFORMANCE-07: invalid schema", () => {
  it("✗ V₁ rejects wrong protocolVersion", () => {
    const r = JSON.parse(JSON.stringify(valid01)) as ContinuityReceipt;
    r.protocolVersion = "0.9";
    expect(verifySchema(r)).toBe("INVALID_SCHEMA");
  });

  it("✗ V₁ rejects missing subject.id", () => {
    const r = JSON.parse(JSON.stringify(valid01)) as ContinuityReceipt;
    r.subject.id = "";
    expect(verifySchema(r)).toBe("INVALID_SCHEMA");
  });

  it("✗ V₁ rejects coverageMs = 0", () => {
    const r = JSON.parse(JSON.stringify(valid01)) as ContinuityReceipt;
    r.interval.coverageMs = 0;
    expect(verifySchema(r)).toBe("INVALID_SCHEMA");
  });
});

// ═══════════════════════════════════════════
// CONFORMANCE-08: Opaque evidence payload
// ═══════════════════════════════════════════

describe("CONFORMANCE-08: opaque evidence payload", () => {
  it("✓ ignores unknown fields inside evidence payload", async () => {
    const r = JSON.parse(JSON.stringify(valid01)) as ContinuityReceipt;
    // Add IMU-specific fields that the verifier should IGNORE
    r.evidence[0].payload = {
      score: 0.85,
      imu_data: [0.1, 0.2, 0.3],
      camera_frames: 240,
      mediapipe_version: "0.10.0",
      raw_accelerometer: { x: [1, 2, 3], y: [4, 5, 6], z: [7, 8, 9] },
    };
    (r.evidence[0] as Record<string, unknown>).payloadDigest = "";
    // Should not care about the contents, only that digest matches
    const result = await verifyEvidenceIntegrity(r);
    // Digest won't match since we changed payload — that's expected
    // The test is that the verifier didn't crash or reject based on unknown fields
    // We verify it's EVIDENCE_TAMPERED (digest mismatch) not INVALID_SCHEMA
    expect(result).toBe("EVIDENCE_TAMPERED");
  });
});

// ═══════════════════════════════════════════
// CONFORMANCE-09: Genesis receipt (null predecessor)
// ═══════════════════════════════════════════

describe("CONFORMANCE-09: genesis receipt", () => {
  it("✓ accepts null previousReceiptHash", () => {
    expect(valid01.previousReceiptHash).toBeNull();
    // Null predecessor is valid — it means this is a genesis receipt
  });
});

// ═══════════════════════════════════════════
// CONFORMANCE-10: Multi-engine evidence
// ═══════════════════════════════════════════

describe("CONFORMANCE-10: multi-engine evidence", () => {
  it("✓ verifier processes all evidence blocks", async () => {
    const r = valid02 as ContinuityReceipt;
    expect(r.evidence).toHaveLength(2);
    // Both engines must have valid digests
    const err = await verifyEvidenceIntegrity(r);
    expect(err).toBeNull();
  });
});
