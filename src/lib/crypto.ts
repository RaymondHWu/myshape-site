// ============================================================
// MyShape Protocol — Cryptographic Primitives
//
// Ed25519 key generation, signing, and verification.
// Uses @noble/curves (already a project dependency).
//
// Browser-safe: ed25519.utils.randomSecretKey() uses
// crypto.getRandomValues under the hood.
// ============================================================

import { ed25519 } from "@noble/curves/ed25519.js";
import { sha256Hex } from "@/lib/hash";

// ── Types ──

export interface KeyPair {
  /** 32-byte secret key (hex) */
  secretKey: string;
  /** 32-byte public key (hex) */
  publicKey: string;
}

// ── Key Generation ──

/** Generate a new Ed25519 keypair. */
export function generateKeyPair(): KeyPair {
  const secretKey = ed25519.utils.randomSecretKey();
  const publicKey = ed25519.getPublicKey(secretKey);
  return {
    secretKey: bytesToHex(secretKey),
    publicKey: bytesToHex(publicKey),
  };
}

/** Derive the public key from a secret key. */
export function getPublicKey(secretKeyHex: string): string {
  const sk = hexToBytes(secretKeyHex);
  return bytesToHex(ed25519.getPublicKey(sk));
}

// ── Signing ──

/**
 * Sign a message with Ed25519.
 *
 * @param message — the string to sign
 * @param secretKeyHex — 32-byte secret key (hex)
 * @returns 64-byte signature (hex)
 */
export function sign(message: string, secretKeyHex: string): string {
  const sk = hexToBytes(secretKeyHex);
  const msgBytes = new TextEncoder().encode(message);
  const sig = ed25519.sign(msgBytes, sk);
  return bytesToHex(sig);
}

// ── Verification ──

/**
 * Verify an Ed25519 signature.
 *
 * @param signatureHex — 64-byte signature (hex)
 * @param message — the original signed message
 * @param publicKeyHex — 32-byte public key (hex)
 */
export function verify(signatureHex: string, message: string, publicKeyHex: string): boolean {
  try {
    const sig = hexToBytes(signatureHex);
    const pk = hexToBytes(publicKeyHex);
    const msgBytes = new TextEncoder().encode(message);
    return ed25519.verify(sig, msgBytes, pk);
  } catch {
    return false;
  }
}

// ── Identity ──

/**
 * Derive a deterministic issuer identity from a device salt.
 * The issuer ID is a SHA-256 fingerprint of the public key.
 */
export function createIssuerIdentity(keyPair: KeyPair): {
  id: string;
  publicKey: string;
} {
  return {
    id: sha256Hex(keyPair.publicKey).slice(0, 16),
    publicKey: keyPair.publicKey,
  };
}

// ── Key persistence (browser localStorage) ──

const KEY_STORAGE_KEY = "myshape_ed25519_sk";

/**
 * Get or create a persistent Ed25519 keypair.
 * Stores the secret key in localStorage (⚠️ not extractable —
 * production should use WebCrypto non-extractable keys or a hardware token).
 */
export function getOrCreateKeyPair(): KeyPair {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem(KEY_STORAGE_KEY);
    if (stored) {
      try {
        const sk = stored;
        return { secretKey: sk, publicKey: getPublicKey(sk) };
      } catch {
        // Corrupted storage — regenerate
      }
    }
  }

  const kp = generateKeyPair();
  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(KEY_STORAGE_KEY, kp.secretKey);
    } catch {
      // Storage full or unavailable — key is ephemeral
    }
  }
  return kp;
}

// ── Helpers ──

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
