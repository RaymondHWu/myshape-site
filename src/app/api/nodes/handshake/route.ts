/**
 * POST /api/nodes/handshake — Genesis Node Initialization
 *
 * Inserts a new node into developer_nodes.
 * node_statistics is auto-updated by Supabase trigger — no app-level counting.
 *
 * Request:  { email, origin_domain?, sdk_version? }
 * Response: { node_token, stage, initialized_at, latency_ms }
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateNodeToken(): string {
  return "ms_" + randomBytes(16).toString("hex");
}

export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const originDomain = (body.origin_domain || request.headers.get("origin") || "direct").slice(0, 128);
    const sdkVersion = (body.sdk_version || "unknown").slice(0, 32);

    // ── Validate ──
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "INVALID_IDENTITY_VECTOR", stage: "REJECTED" },
        { status: 400 }
      );
    }

    // ── Connect ──
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "PROTOCOL_CORE_UNREACHABLE", stage: "DEGRADED" },
        { status: 500 }
      );
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── Rate limit: 3 per email per hour ──
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count } = await supabase
      .from("developer_nodes")
      .select("*", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: "HANDSHAKE_RATE_EXCEEDED", stage: "THROTTLED", retry_after_s: 3600 },
        { status: 429, headers: { "Retry-After": "3600" } }
      );
    }

    // ── Check duplicate email ──
    const { data: existing } = await supabase
      .from("developer_nodes")
      .select("api_key, created_at")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        node_token: existing.api_key,
        initialized_at: existing.created_at,
        stage: "NODE_ALREADY_ACTIVE",
        message: "This identity vector is already registered.",
        latency_ms: Date.now() - startTime,
      });
    }

    // ── Insert new node ──
    const nodeToken = generateNodeToken();
    const timestamp = new Date().toISOString();

    const { error } = await supabase.from("developer_nodes").insert({
      email,
      api_key: nodeToken,
      status: "ACTIVE",
      sdk_version: sdkVersion,
      origin_domain: originDomain,
      created_at: timestamp,
      last_used_at: timestamp,
    });

    if (error) {
      // Handle PK collision on api_key (astronomically unlikely but graceful)
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "TOKEN_COLLISION", stage: "RETRY", message: "Re-submit to generate a new token." },
          { status: 409 }
        );
      }
      console.error("[handshake] Insert failed:", error.message);
      return NextResponse.json(
        { error: "NODE_INITIALIZATION_FAILED", stage: "ERROR" },
        { status: 500 }
      );
    }

    // ── Optional: welcome email via Resend ──
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "MyShape Protocol <protocol@myshape.me>",
          to: email,
          subject: "GENESIS_NODE_INITIALIZED — Your Protocol Access Credentials",
          text: `NODE_TOKEN: ${nodeToken}\n\nUse in Authorization: Bearer header.\nDocs: https://myshape.me/developers\n\n— MyShape Protocol Core`,
        });
      } catch (e) {
        console.warn("[handshake] Welcome email failed (non-critical):", (e as Error).message);
      }
    }

    // ── Respond ──
    return NextResponse.json({
      node_token: nodeToken,
      stage: "GENESIS_NODE_INITIALIZED",
      initialized_at: timestamp,
      latency_ms: Date.now() - startTime,
    });
  } catch (err) {
    console.error("[handshake]", err);
    return NextResponse.json(
      { error: "PROTOCOL_CORE_INTERRUPT", stage: "CRITICAL" },
      { status: 500 }
    );
  }
}
