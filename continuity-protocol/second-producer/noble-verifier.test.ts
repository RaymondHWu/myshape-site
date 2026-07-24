/**
 * Cross-implementation interoperability test.
 *
 * Verifies that receipts produced by the noble verifier
 * pass verification by MyShape's CPS-0001 module,
 * and vice versa.
 */

import { describe, it, expect } from "vitest";
import * as noble from "./noble-verifier";
import {
  verifyReceipt as myshapeVerify,
  buildReceipt as myshapeBuild,
  computePayloadDigest as myshapeDigest,
  signReceipt as myshapeSign,
  type ContinuityReceipt,
} from "@/lib/evidence/cps0001";
import { generateKeyPair, createIssuerIdentity } from "@/lib/crypto";

// ── Noble helper ──

function makeNobleReceipt(): ContinuityReceipt {
  const kp = generateKeyPair();
  const issuer = createIssuerIdentity(kp);
  const payload = { entropy: 0.72 };
  const digest = noble.computePayloadDigest(payload);

  const unsigned = noble.buildReceipt({
    evidence: [{
      engineId: "EE-001",
      engineVersion: "1.0.0",
      confidence: 0.85,
      payload,
      payloadDigest: digest,
    }],
    interval: {
      start: new Date(Date.now() - 1000).toISOString(),
      end: new Date().toISOString(),
      coverageMs: 1000,
    },
    subject: { id: "noble-test-subject", type: "embodied" },
    issuer,
  });

  return noble.signReceipt(unsigned, kp.secretKey);
}

// ── Tests ──

describe("Noble verifier self-consistency", () => {
  it("builds and verifies its own receipts", () => {
    const receipt = makeNobleReceipt();
    const result = noble.verifyReceipt(receipt);
    expect(result.status).toBe("VALID");
  });

  it("rejects tampered evidence", () => {
    const receipt = makeNobleReceipt();
    receipt.evidence[0].payloadDigest = "00".repeat(32);
    expect(noble.verifyReceipt(receipt).status).toBe("INVALID");
    expect(noble.verifyEvidenceIntegrity(receipt)).toBe("EVIDENCE_TAMPERED");
  });

  it("rejects wrong protocol version", () => {
    const receipt = makeNobleReceipt();
    receipt.protocolVersion = "0.5";
    expect(noble.verifySchema(receipt)).toBe("INVALID_SCHEMA");
  });
});

describe("Cross-implementation: Noble → MyShape", () => {
  it("Noble receipt passes MyShape verification", () => {
    const receipt = makeNobleReceipt();
    const result = myshapeVerify(receipt);
    expect(result.status).toBe("VALID");
  });

  it("MyShape correctly rejects Noble receipt with tampered evidence", () => {
    const receipt = makeNobleReceipt();
    receipt.evidence[0].payload = { entropy: 0.01 }; // tampered
    const result = myshapeVerify(receipt);
    expect(result.status).toBe("INVALID");
    if (result.status === "INVALID") expect(result.reason).toBe("EVIDENCE_TAMPERED");
  });
});

describe("Cross-implementation: MyShape → Noble", () => {
  it("MyShape receipt passes Noble verification", () => {
    const kp = generateKeyPair();
    const issuer = createIssuerIdentity(kp);
    const payload = { entropy: 0.80 };
    const digest = myshapeDigest(payload);

    const unsigned = myshapeBuild({
      evidence: [{
        engineId: "EE-001",
        engineVersion: "1.0.0",
        confidence: 0.80,
        payload,
        payloadDigest: digest,
      }],
      interval: {
        start: new Date(Date.now() - 1000).toISOString(),
        end: new Date().toISOString(),
        coverageMs: 1000,
      },
      subject: { id: "myshape-test-subject", type: "embodied" },
      issuer,
    });

    const receipt = myshapeSign(unsigned, kp.secretKey);
    const result = noble.verifyReceipt(receipt);
    expect(result.status).toBe("VALID");
  });
});
