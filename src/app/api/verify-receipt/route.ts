import { NextResponse } from "next/server";
import { verifyReceipt, type ContinuityReceipt } from "@/lib/evidence/cps0001";
import { apiLookupLimiter, getClientIP } from "@/lib/rate-limiter";

/**
 * POST /api/verify-receipt
 *
 * CPS-0001 Continuity Verification API endpoint.
 * Accepts a ContinuityReceipt as JSON body, returns V₁-V₆ result + risk.
 *
 * Engine-independent — any CPS-0001 implementation can call this.
 * Rate limited: 3 requests/IP/hour.
 */
export async function POST(req: Request): Promise<NextResponse> {
  // Rate limit
  const ip = getClientIP(req);
  const limit = apiLookupLimiter.check(ip);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: new Date(limit.resetAt).toISOString() },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } },
    );
  }

  // Parse body
  let receipt: ContinuityReceipt;
  try {
    receipt = (await req.json()) as ContinuityReceipt;
  } catch {
    return NextResponse.json(
      { status: "INVALID", reason: "INVALID_SCHEMA", detail: "Failed to parse CPS-0001 JSON.", risk: 1.0 },
      { status: 400 },
    );
  }

  // Verify (sync — @noble/hashes, works in Edge + Node.js)
  const result = verifyReceipt(receipt);

  if (result.status === "VALID") {
    return NextResponse.json({
      status: "VALID",
      risk: computeRisk(receipt),
      receiptId: receipt.receiptId,
      subject: receipt.subject.id,
      interval: receipt.interval.coverageMs,
      verifiedAt: new Date().toISOString(),
    });
  }

  return NextResponse.json(
    {
      status: "INVALID",
      reason: result.reason,
      detail: result.detail,
      risk: 1.0,
      verifiedAt: new Date().toISOString(),
    },
    {
      status: result.reason === "EXPIRED" || result.reason === "EVIDENCE_TAMPERED" ? 403 : 400,
    },
  );
}

function computeRisk(receipt: ContinuityReceipt): number {
  let risk = 0;
  if (receipt.interval.coverageMs < 3000) risk += 0.3;
  const conf = receipt.assertions.continuityMaintained.confidence;
  if (conf < 0.5) risk += 0.4;
  else if (conf < 0.7) risk += 0.2;
  if (receipt.interval.end) {
    const ageMs = Date.now() - new Date(receipt.interval.end).getTime();
    if (ageMs > 300_000) risk += 0.3;
    else if (ageMs > 60_000) risk += 0.1;
  }
  return Math.min(risk, 1.0);
}
