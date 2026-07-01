/**
 * GET /api/nodes/stats — Developer Node Telemetry
 *
 * Aggregate stats for the admin dashboard.
 * Shows active nodes, top origin domains, SDK version distribution.
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

    // Total active nodes
    const { count: totalNodes } = await supabase
      .from("developer_keys")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE");

    // Nodes created today
    const today = new Date().toISOString().slice(0, 10);
    const { count: todayNodes } = await supabase
      .from("developer_keys")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today);

    // All nodes for aggregation
    const { data: allNodes, error } = await supabase
      .from("developer_keys")
      .select("origin_domain, sdk_version, created_at, last_used_at, request_count")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate by origin domain
    const domainMap: Record<string, number> = {};
    const sdkMap: Record<string, number> = {};
    let totalRequests = 0;
    let activeLast7d = 0;
    const sevenDaysAgo = Date.now() - 7 * 86400000;

    for (const n of allNodes || []) {
      const domain = n.origin_domain || "direct";
      domainMap[domain] = (domainMap[domain] || 0) + 1;

      const sdk = n.sdk_version || "unknown";
      sdkMap[sdk] = (sdkMap[sdk] || 0) + 1;

      totalRequests += n.request_count || 0;
      if (n.last_used_at && new Date(n.last_used_at).getTime() > sevenDaysAgo) {
        activeLast7d++;
      }
    }

    return NextResponse.json({
      total_nodes: totalNodes ?? 0,
      today_nodes: todayNodes ?? 0,
      active_last_7d: activeLast7d,
      total_requests: totalRequests,
      top_domains: Object.entries(domainMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([domain, count]) => ({ domain, count })),
      sdk_versions: Object.entries(sdkMap)
        .sort((a, b) => b[1] - a[1])
        .map(([version, count]) => ({ version, count })),
      recent_nodes: (allNodes || []).slice(0, 10).map(n => ({
        origin: n.origin_domain || "direct",
        sdk: n.sdk_version || "unknown",
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
