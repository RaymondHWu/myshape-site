import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function randomHex(len: number): string {
  return randomBytes(len).toString("hex");
}

export async function POST(request: Request) {
  try {
    const { email, origin_domain } = await request.json();

    if (!email?.includes("@")) {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // ── Dedup ──
    const { data: existing } = await supabase
      .from("protocol_nodes")
      .select("email")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "NODE_ALREADY_ACTIVE" },
        { status: 409 }
      );
    }

    // ── Generate identifiers ──
    const nodeHandle = `SIG_${randomHex(4).toUpperCase()}`;
    const nodeToken = `ms_${randomHex(16)}`;

    // ── Insert ──
    const { error } = await supabase.from("protocol_nodes").insert({
      email: email.trim().toLowerCase(),
      node_handle: nodeHandle,
      node_token: nodeToken,
      status: "GENESIS_CONNECTED",
      visual_config: { origin_domain: origin_domain || "direct" },
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[handshake]", error);
      return NextResponse.json(
        { error: "NODE_INITIALIZATION_FAILED" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      node_token: nodeToken,
      node_handle: nodeHandle,
      stage: "GENESIS_NODE_INITIALIZED",
    });
  } catch {
    return NextResponse.json(
      { error: "PROTOCOL_CORE_INTERRUPT" },
      { status: 500 }
    );
  }
}
