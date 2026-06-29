import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/recruitment/list — Admin view of all recruitment applications
 * Emails are masked for privacy. No auth required (local dev only).
 */
export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { data, error, count } = await supabase
      .from("recruitment_applications")
      .select("*", { count: "exact" })
      .order("applied_at", { ascending: false });

    if (error) throw error;

    const applications = (data || []).map((a) => ({
      email: a.email ? a.email.slice(0, 2) + "***" + a.email.split("@")[1] : "N/A",
      cohort: a.cohort || "pending",
      technical_bg: a.technical_bg || "-",
      handle: a.handle || "-",
      position: a.position ?? null,
      applied_at: a.applied_at || null,
    }));

    return NextResponse.json({
      total: count ?? 0,
      genesis_count: data?.filter((a) => a.cohort === "genesis").length ?? 0,
      genesis_cap: 50,
      applications,
    });
  } catch (err) {
    console.error("[recruitment/list]", err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
