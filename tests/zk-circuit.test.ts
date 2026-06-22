/**
 * ZK Circuit — Unit Test
 * Verifies Pedersen commitment + Schnorr proof end-to-end.
 *
 * Run: npx tsx tests/zk-circuit.test.ts
 */

import { pedersenCommit, pedersenVerify, schnorrProve, schnorrVerify, generateZKPresenceProof, verifyExternalZKPresence } from "../src/engine/zk-circuit";

console.log("═".repeat(72));
console.log("  MyShape Protocol — ZK Circuit Unit Test");
console.log("═".repeat(72));
console.log("");

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean): void {
  if (condition) { passed++; console.log(`✅ ${label}`); }
  else { failed++; console.log(`❌ ${label}`); }
}

// ── Test 1: Pedersen Commitment ──
const message = "PES:0.72:MV_HASH:abc123";
const cmt = pedersenCommit(message);

assert("Pedersen: generates commitment", cmt.commitment.length === 64);
assert("Pedersen: generates blinding", cmt.blinding.length === 64);
assert("Pedersen: commitment ≠ message", cmt.commitment !== message);

// Verify correctly
const verified = pedersenVerify(cmt.commitment, message, cmt.blinding);
assert("Pedersen: verify succeeds with correct data", verified);

// Verify with wrong message
const wrongVerify = pedersenVerify(cmt.commitment, "wrong message", cmt.blinding);
assert("Pedersen: verify fails with wrong message", !wrongVerify);

// Verify with wrong blinding
const wrongBlinding = pedersenVerify(cmt.commitment, message, "00".repeat(32));
assert("Pedersen: verify fails with wrong blinding", !wrongBlinding);

// ── Test 2: Schnorr Proof ──
const witness = { message, blinding: cmt.blinding };
const proof = schnorrProve(cmt, witness);

assert("Schnorr: generates challenge", proof.challenge.length === 64);
assert("Schnorr: generates response_m", proof.response_m.length === 64);
assert("Schnorr: generates response_r", proof.response_r.length === 64);

// Verify correct proof
const proofVerified = schnorrVerify(cmt, proof);
assert("Schnorr: verify succeeds with valid proof", proofVerified);

// Verify with wrong commitment
const wrongCmt = pedersenCommit("different data");
const wrongProofVerify = schnorrVerify(wrongCmt, proof);
assert("Schnorr: verify fails with wrong commitment", !wrongProofVerify);

// ── Test 3: Full ZK-Presence Pipeline ──
const result = generateZKPresenceProof("PES:0.68:HASH:def456", "device_salt_xyz");
assert("Pipeline: generates commitment", result.commitment.commitment.length === 64);
assert("Pipeline: generates proof", result.proof.challenge.length === 64);
assert("Pipeline: self-verify passes", result.verified);
assert("Pipeline: presence_hash is 16 chars", result.presence_hash.length === 16);

// ── Test 4: External Verification ──
const externalVerify = verifyExternalZKPresence(result.commitment, result.proof);
assert("External: verify passes with valid proof", externalVerify);

// Tampered proof should fail
const tamperedProof = { ...result.proof, challenge: "0".repeat(64) };
const tamperedVerify = verifyExternalZKPresence(result.commitment, tamperedProof);
assert("External: verify fails with tampered proof", !tamperedVerify);

// ── Test 5: Zero-Knowledge Property ──
// Verifier learns NOTHING about the original message from commitment + proof
const cmt2 = pedersenCommit("PES:0.72:MV_HASH:abc123");
const cmt3 = pedersenCommit("PES:0.72:MV_HASH:abc123");
assert("ZK: Same message → different commitments", cmt2.commitment !== cmt3.commitment);
assert("ZK: Cannot distinguish commitments (equal length)", cmt2.commitment.length === cmt3.commitment.length);

console.log("");
console.log("═".repeat(72));
console.log(`  Results: ${passed} passed, ${failed} failed out of ${passed + failed}`);
console.log("═".repeat(72));

process.exit(failed > 0 ? 1 : 0);
