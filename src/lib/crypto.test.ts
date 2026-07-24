import { describe, it, expect } from "vitest";
import {
  generateKeyPair,
  getPublicKey,
  sign,
  verify,
  createIssuerIdentity,
} from "./crypto";

describe("Ed25519 key generation", () => {
  it("generates a 32-byte secret key (64 hex chars)", () => {
    const kp = generateKeyPair();
    expect(kp.secretKey).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates a 32-byte public key (64 hex chars)", () => {
    const kp = generateKeyPair();
    expect(kp.publicKey).toMatch(/^[0-9a-f]{64}$/);
  });

  it("generates unique keypairs on each call", () => {
    const kp1 = generateKeyPair();
    const kp2 = generateKeyPair();
    expect(kp1.secretKey).not.toBe(kp2.secretKey);
    expect(kp1.publicKey).not.toBe(kp2.publicKey);
  });

  it("getPublicKey recovers the correct public key", () => {
    const kp = generateKeyPair();
    const recovered = getPublicKey(kp.secretKey);
    expect(recovered).toBe(kp.publicKey);
  });
});

describe("Ed25519 sign + verify", () => {
  it("signs a message and verifies successfully", () => {
    const kp = generateKeyPair();
    const message = "receipt:abc123:2026-07-24T10:00:00.000Z";
    const sig = sign(message, kp.secretKey);
    expect(sig).toMatch(/^[0-9a-f]{128}$/); // 64 bytes = 128 hex

    const valid = verify(sig, message, kp.publicKey);
    expect(valid).toBe(true);
  });

  it("rejects a forged signature (wrong message)", () => {
    const kp = generateKeyPair();
    const sig = sign("original message", kp.secretKey);
    const valid = verify(sig, "tampered message", kp.publicKey);
    expect(valid).toBe(false);
  });

  it("rejects a signature from a different key", () => {
    const kp1 = generateKeyPair();
    const kp2 = generateKeyPair();
    const sig = sign("message", kp1.secretKey);
    const valid = verify(sig, "message", kp2.publicKey);
    expect(valid).toBe(false);
  });

  it("verify returns false for malformed signatures", () => {
    const kp = generateKeyPair();
    expect(verify("not-a-valid-hex-signature", "msg", kp.publicKey)).toBe(false);
    expect(verify("", "msg", kp.publicKey)).toBe(false);
  });

  it("produces different signatures for different messages", () => {
    const kp = generateKeyPair();
    const sig1 = sign("message A", kp.secretKey);
    const sig2 = sign("message B", kp.secretKey);
    expect(sig1).not.toBe(sig2);
  });
});

describe("createIssuerIdentity", () => {
  it("produces a 16-char hex issuer ID", () => {
    const kp = generateKeyPair();
    const issuer = createIssuerIdentity(kp);
    expect(issuer.id).toMatch(/^[0-9a-f]{16}$/);
    expect(issuer.publicKey).toBe(kp.publicKey);
  });

  it("is deterministic for the same keypair", () => {
    const kp = generateKeyPair();
    const i1 = createIssuerIdentity(kp);
    const i2 = createIssuerIdentity(kp);
    expect(i1.id).toBe(i2.id);
  });

  it("produces different IDs for different keys", () => {
    const kp1 = generateKeyPair();
    const kp2 = generateKeyPair();
    expect(createIssuerIdentity(kp1).id).not.toBe(createIssuerIdentity(kp2).id);
  });
});
