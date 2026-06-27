/**
 * POST /api/verify — Server-side Presence Verification
 *
 * Runs the MyShape WASM engine on the server to verify a challenge response.
 * Accepts flat-format JSON (the same format the browser SDK produces).
 *
 * Request payload:
 *   { enrollment, challenge, response, signature, risk_level }
 *
 * Returns:
 *   VerificationResult { verified, presence_score, factors, ... }
 *
 * Runtime: Node.js (required for WASM)
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { enrollment, challenge, response, signature, risk_level } = payload;

    // Validate required fields
    if (!enrollment || !challenge || !response || !signature) {
      return Response.json(
        { error: 'Missing required fields: enrollment, challenge, response, signature' },
        { status: 400 }
      );
    }

    // Lazy-load WASM engine (cached after first load)
    const wasm = await loadWasmEngine();

    // Verify challenge token (anti-replay)
    if (!challenge.challenge_token || !challenge.challenge_id) {
      return Response.json(
        { error: 'Invalid challenge: missing token or ID' },
        { status: 400 }
      );
    }

    // Run verification
    const riskLevel = risk_level ?? 'medium';
    const resultJson = wasm.verify_intent(
      JSON.stringify(enrollment),
      JSON.stringify(challenge),
      JSON.stringify(response),
      JSON.stringify(signature),
      riskLevel
    );

    const result = JSON.parse(resultJson);

    return Response.json({
      verified: result.verified,
      presence_score: result.presence_score,
      factors: result.factors,
      risk_level: result.risk_level,
      threshold: result.threshold,
      rejection_reason: result.rejection_reason ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    console.error('[verify] Error:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}

// ── WASM Engine Singleton ───────────────────────────────────────────

let wasmEngine: WasmVerifyModule | null = null;

interface WasmVerifyModule {
  verify_intent(
    enrollment_json: string,
    challenge_json: string,
    response_json: string,
    signature_json: string,
    risk_level: string
  ): string;
}

async function loadWasmEngine(): Promise<WasmVerifyModule> {
  if (wasmEngine) return wasmEngine;

  // Dynamic import from the Node.js WASM target
  // Path relative to this file: src/app/api/verify/ → ../../../../wasm/pkg/
  const wasm = await import('../../../../wasm/pkg/myshape_wasm.js');
  wasmEngine = wasm as WasmVerifyModule;
  return wasmEngine;
}
