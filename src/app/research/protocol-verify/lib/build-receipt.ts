// ═══════════════════════════════════════════════════════════════════
// Phase A — Receipt Builder
//
// Pure: EngineEvidence[] → ContinuityReceipt
// Does NOT make business decisions (no allow/deny, no risk, no verdict).
// =====================================================================

import {
  engineEvidenceToBlock,
  buildReceipt,
  verifyReceipt,
  signReceipt,
  createReceiptId,
  type ContinuityReceipt,
  type SubjectRef,
  type IssuerIdentity,
  type VerificationResult,
} from "@/lib/evidence/cps0001";
import type { EngineEvidence } from "@/lib/evidence/types";
import { getOrCreateKeyPair, createIssuerIdentity } from "@/lib/crypto";

export interface BuildReceiptParams {
  evidence: EngineEvidence[];
  startTime: Date;
  endTime: Date;
  subjectId?: string;
  previousReceiptHash?: string | null;
}

export interface BuildReceiptResult {
  receipt: ContinuityReceipt;
  verification: VerificationResult;
}

export function buildEvidenceReceipt(params: BuildReceiptParams): BuildReceiptResult {
  const { evidence, startTime, endTime, previousReceiptHash } = params;
  const subjectId = params.subjectId ?? getOrCreateSubjectId();

  // Step 1: Convert EngineEvidence[] → EvidenceBlock[]
  const evidenceBlocks = evidence.map((e) => engineEvidenceToBlock(e));

  // Step 2: Build interval
  const coverageMs = endTime.getTime() - startTime.getTime();

  // Step 3: Subject reference
  const subject: SubjectRef = {
    id: `sha256:${subjectId}`,
    type: "embodied",
  };

  // Step 4: Ed25519 issuer identity
  const keyPair = getOrCreateKeyPair();
  const issuer = createIssuerIdentity(keyPair);

  // Step 5: Build unsigned receipt
  const unsigned = buildReceipt({
    evidence: evidenceBlocks,
    interval: {
      start: startTime.toISOString(),
      end: endTime.toISOString(),
      coverageMs,
    },
    subject,
    issuer,
    previousReceiptHash: previousReceiptHash ?? null,
  });

  // Step 6: Sign with Ed25519
  const receipt = signReceipt(unsigned, keyPair.secretKey);

  // Step 7: Sidecar verification
  const verification = verifyReceipt(receipt);

  return { receipt, verification };
}

function getOrCreateSubjectId(): string {
  if (typeof window === "undefined") return `demo-${Date.now()}`;
  let id = localStorage.getItem("vfy-dev");
  if (!id) {
    id = createReceiptId();
    localStorage.setItem("vfy-dev", id);
  }
  return id;
}
