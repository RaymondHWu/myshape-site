/**
 * my-engine.mjs
 * 外部独立实现的 CPS-0001 引擎与凭证生成器 (Zero src/ imports)
 */
import { sha256 } from '@noble/hashes/sha2.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import crypto from 'crypto';

// 纯原生工具函数：Hex 与 Bytes 互相转换
function bytesToHex(bytes) {
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}

// 1. 模拟外部采集的自定义 Evidence
const rawInput = "hello CPS-0001 from external implementer 12345";
const encoder = new TextEncoder();
const inputBytes = encoder.encode(rawInput);

// 计算 Evidence Hash (SHA-256)
const evidenceHashBytes = sha256(inputBytes);
const evidenceHash = bytesToHex(evidenceHashBytes);

// 2. 构造 Evidence Block
const evidenceBlock = {
    engineId: "EE-EXTERNAL-001",
    timestamp: Date.now(),
    nonce: Math.floor(Math.random() * 1000000),
    confidence: 0.61,
    evidenceHash: `0x${evidenceHash}`
};

console.log("----------------------------------------");
console.log(`Info: [Engine Authored] Engine: ${evidenceBlock.engineId}`);
console.log(`Input:  "${rawInput}"`);
console.log(`Confidence: ${evidenceBlock.confidence}`);
console.log("----------------------------------------");

// 3. 使用标准密码学随机数生成主权身份私钥 (32字节)
const privateKey = crypto.getRandomValues(new Uint8Array(32));
const publicKey = secp256k1.getPublicKey(privateKey, true);
const publicKeyHex = `0x${bytesToHex(publicKey)}`;

// 4. 组装待签名载荷 (Canonical Payload)
const payloadToSign = `${evidenceBlock.engineId}:${evidenceBlock.timestamp}:${evidenceBlock.nonce}:${evidenceBlock.confidence}:${evidenceBlock.evidenceHash}`;
const payloadHash = sha256(encoder.encode(payloadToSign));

// 5. 使用 Secp256k1 签名（新版本直接返回 Uint8Array 字节数组）
const sigBytes = secp256k1.sign(payloadHash, privateKey);
const signatureHex = `0x${bytesToHex(sigBytes)}`;

// 6. 组装最终的 CPS-0001 Receipt
const receipt = {
    version: "CPS-0001",
    block: evidenceBlock,
    publicKey: publicKeyHex,
    signature: signatureHex
};

// ==========================================
// 7. 执行 V1 - V6 本地互操作验证器
// ==========================================
function verifyReceipt(r) {
    console.log("Running V₁-V₆ Local Verification...");
    
    const v1 = r.version === "CPS-0001";
    console.log(`  [V₁] Protocol Version: ${v1 ? '✅ PASS' : '❌ FAIL'}`);

    const now = Date.now();
    const timeDiff = Math.abs(now - r.block.timestamp);
    const v2 = timeDiff < 5 * 60 * 1000;
    console.log(`  [V₂] Timestamp Window: ${v2 ? '✅ PASS' : '❌ FAIL'}`);

    const v3 = typeof r.block.engineId === 'string' && r.block.engineId.startsWith("EE-");
    console.log(`  [V₃] Engine ID Format: ${v3 ? '✅ PASS' : '❌ FAIL'}`);

    const v4 = typeof r.block.confidence === 'number' && r.block.confidence >= 0.5;
    console.log(`  [V₄] Confidence Threshold: ${v4 ? '✅ PASS' : '❌ FAIL'}`);

    const v5 = typeof r.block.evidenceHash === 'string' && r.block.evidenceHash.length === 66;
    console.log(`  [V₅] Evidence Hash Integrity: ${v5 ? '✅ PASS' : '❌ FAIL'}`);

    const reconstructedPayload = `${r.block.engineId}:${r.block.timestamp}:${r.block.nonce}:${r.block.confidence}:${r.block.evidenceHash}`;
    const reconHash = sha256(encoder.encode(reconstructedPayload));
    
    let v6 = false;
    try {
        const sBytes = hexToBytes(r.signature.slice(2));
        const pubBytes = hexToBytes(r.publicKey.slice(2));
        v6 = secp256k1.verify(sBytes, reconHash, pubBytes);
    } catch (e) {
        v6 = false;
    }
    console.log(`  [V₆] Cryptographic Signature: ${v6 ? '✅ PASS' : '❌ FAIL'}`);

    return v1 && v2 && v3 && v4 && v5 && v6;
}

const isValid = verifyReceipt(receipt);
console.log("----------------------------------------");
console.log(`VERDICT: ${isValid ? 'VALID' : 'INVALID'}`);
console.log("----------------------------------------");