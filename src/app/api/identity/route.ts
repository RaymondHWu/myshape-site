import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// ── Rate limiter: 10 lookups per IP per minute ──
const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

export async function GET(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRate(ip)) {
      return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
    }

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "INVALID_EMAIL" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "SERVER_CONFIGURATION_INCOMPLETE" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase
      .from("protocol_nodes")
      .select("email, node_handle, status, created_at")
      .eq("email", email.trim())
      .single();

    if (error || !data) {
      return NextResponse.json({ found: false, email: email.trim() });
    }

    return NextResponse.json({
      found: true,
      email: data.email,
      node_handle: data.node_handle,
      status: data.status,
      registered_at: data.created_at,
    });
  } catch (err) {
    console.error("[/api/identity]", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
