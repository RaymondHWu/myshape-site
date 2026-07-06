// ═══════════════════════════════════════════════════════════════════
// MyShape Protocol — Sandbox Test Account Cleanup
// ═══════════════════════════════════════════════════════════════════
//
// Usage:
//   node scripts/supabase/cleanup-sandbox.js          → dry-run (preview only)
//   node scripts/supabase/cleanup-sandbox.js --commit → actually delete
//
// Targets: protocol_nodes where status = 'ACTIVE' (legacy sandbox)
//          AND email ends with '@sandbox.myshape.dev'
//
// Safety:
//   - NEVER touches GENESIS_CONNECTED / GENESIS_NODE / SUBSCRIBED
//   - Dry-run by default (--commit required for deletion)
//   - Prints every record before deleting

const { createClient } = require("@supabase/supabase-js");
const { readFileSync, existsSync } = require("fs");
const { resolve } = require("path");

const ENV_PATH = resolve(process.cwd(), ".env.local");

function loadEnv() {
  if (!existsSync(ENV_PATH)) {
    console.error("❌ .env.local not found at", ENV_PATH);
    process.exit(1);
  }
  const vars = {};
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0 && !line.trim().startsWith("#")) {
      vars[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    }
  }
  return vars;
}

async function main() {
  const isCommit = process.argv.includes("--commit");
  const env = loadEnv();

  const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"];
  const supabaseKey = env["SUPABASE_SERVICE_ROLE_KEY"] || env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // ── 1. Query matching records ──────────────────────────────────────
  console.log("🔍 Querying sandbox test accounts...\n");

  const { data: rows, error } = await supabase
    .from("protocol_nodes")
    .select("email, node_handle, status, created_at")
    .eq("status", "ACTIVE")
    .ilike("email", "%@sandbox.myshape.dev");

  if (error) {
    console.error("❌ Query failed:", error.message);
    process.exit(1);
  }

  if (!rows || rows.length === 0) {
    console.log("✅ No sandbox ACTIVE records found. Database is clean.\n");
    process.exit(0);
  }

  // ── 2. Safety check: confirm no protected statuses ──────────────────
  const forbidden = rows.filter((r) =>
    ["GENESIS_CONNECTED", "GENESIS_NODE", "SUBSCRIBED"].includes(r.status)
  );
  if (forbidden.length > 0) {
    console.error("❌ SAFETY HALT: Query returned protected records:");
    forbidden.forEach((r) => console.error(`   ${r.email} (${r.status})`));
    process.exit(1);
  }

  // ── 3. Display preview ─────────────────────────────────────────────
  console.log(`📋 Found ${rows.length} sandbox record(s) to clean:\n`);
  rows.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.email}`);
    console.log(`     handle: ${r.node_handle}  |  status: ${r.status}  |  created: ${r.created_at}\n`);
  });

  if (!isCommit) {
    console.log("💡 DRY RUN — no records deleted.");
    console.log("   Re-run with --commit to execute deletion.\n");
    process.exit(0);
  }

  // ── 4. Delete ──────────────────────────────────────────────────────
  console.log("🗑️  Deleting...\n");

  const emails = rows.map((r) => r.email);
  const { error: deleteError, count } = await supabase
    .from("protocol_nodes")
    .delete({ count: "exact" })
    .in("email", emails);

  if (deleteError) {
    console.error("❌ Delete failed:", deleteError.message);
    process.exit(1);
  }

  console.log(`✅ Deleted ${count ?? emails.length} record(s). Database cleaned.\n`);
}

main().catch((err) => {
  console.error("❌", err.message || err);
  process.exit(1);
});
