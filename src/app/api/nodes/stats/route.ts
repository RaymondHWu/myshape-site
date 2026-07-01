/**
 * GET /api/nodes/stats — Developer Node Telemetry
 *
 * Reads from node_statistics (auto-updated by Supabase trigger).
 * Millisecond queries — no application-level aggregation needed.
 */
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Not configured" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Summary table — single row, instant read
    const { data: summary } = await supabase
      .from("node_statistics")
      .select("*")
      .eq("id", 1)
      .single();

    // Recent nodes for the activity feed
    const { data: recent } = await supabase
      .from("developer_nodes")
      .select("origin_domain, sdk_version, created_at, last_used_at, request_count, email")
      .order("created_at", { ascending: false })
      .limit(10);

    // Parse domain/sdk counts from JSONB
    const domainCounts: Record<string, number> = summary?.domain_counts || {};
    const sdkCounts: Record<string, number> = summary?.sdk_counts || {};

    return NextResponse.json({
      total_nodes: summary?.total_nodes ?? 0,
      today_nodes: summary?.today_nodes ?? 0,
      active_last_7d: summary?.active_last_7d ?? 0,
      total_requests: summary?.total_requests ?? 0,
      updated_at: summary?.updated_at,
      top_domains: Object.entries(domainCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([domain, count]) => ({ domain, count })),
      sdk_versions: Object.entries(sdkCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([version, count]) => ({ version, count })),
      recent_nodes: (recent || []).map(n => ({
        origin: n.origin_domain || "direct",
        sdk: n.sdk_version || "unknown",
        email: n.email?.slice(0, 3) + "***",
        created: n.created_at,
        last_used: n.last_used_at,
        requests: n.request_count,
      })),
    });
  } catch (err) {
    console.error("[nodes/stats]", err);
    return NextResponse.json({ error: "Internal" }, { status: 500 });
  }
}
