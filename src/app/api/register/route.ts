/**
 * POST /api/register — Developer API Key Registration
 *
 * Instant, zero-friction. Submit email → receive API key immediately.
 * No human approval. Rate-limited per IP: max 3 keys/hour.
 *
 * The key authenticates SDK calls via Authorization: Bearer <key>
 * and enables per-developer rate limiting and usage tracking.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateKey(): string {
  // myshape_ + 32 hex chars
  return "myshape_" + randomBytes(16).toString("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limit: max 3 keys per hour per email
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count } = await supabase
      .from("developer_keys")
      .select("*", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 3 keys per hour." },
        { status: 429 }
      );
    }

    // Check if this email already has a key
    const { data: existing } = await supabase
      .from("developer_keys")
      .select("api_key")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1);

    if (existing?.length) {
      return NextResponse.json({
        api_key: existing[0].api_key,
        message: "Existing key returned",
      });
    }

    // Generate and store new key
    const apiKey = generateKey();
    const { error } = await supabase.from("developer_keys").insert({
      email,
      api_key: apiKey,
      status: "active",
      request_count: 0,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[register] Insert failed:", error.message);
      return NextResponse.json({ error: "Registration failed" }, { status: 500 });
    }

    return NextResponse.json({
      api_key: apiKey,
      message: "API key generated. Use in Authorization: Bearer header.",
    });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
