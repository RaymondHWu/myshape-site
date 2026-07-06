// ═══════════════════════════════════════════════════════════════════
// MyShape LinkedIn OAuth — Manual Code Exchange
// ═══════════════════════════════════════════════════════════════════
//
// Usage:  npx tsx scripts/linkedin-oauth/auth.ts
//
// This script handles the LinkedIn OAuth flow for remote servers where
// the browser can't reach localhost. Instead of relying on a redirect:
//
//   1. Prints the LinkedIn authorization URL
//   2. You visit it, authorize, LinkedIn tries to redirect to localhost
//   3. The redirect will fail, but the `code` is in your browser's URL bar
//   4. Copy the `code` and paste it back here
//   5. Script exchanges code → tokens → saves to .env.local
//
// Requires: LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET in .env.local

import { createInterface } from "node:readline";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

const ENV_PATH = resolve(process.cwd(), ".env.local");
const STATE = randomUUID();

// ── Read env ─────────────────────────────────────────────────────────

function loadEnv(): Record<string, string> {
  if (!existsSync(ENV_PATH)) throw new Error(`.env.local not found`);
  const vars: Record<string, string> = {};
  for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0 && !line.trim().startsWith("#")) {
      vars[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    }
  }
  return vars;
}

function saveTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
  const content = readFileSync(ENV_PATH, "utf8");
  let updated = content;

  const expiryDate = new Date(Date.now() + expiresIn * 1000).toISOString().slice(0, 10);

  for (const [key, val] of [
    ["LINKEDIN_USER_ACCESS_TOKEN", accessToken],
    ["LINKEDIN_REFRESH_TOKEN", refreshToken],
    ["LINKEDIN_TOKEN_EXPIRY", expiryDate],
  ] as const) {
    if (updated.includes(`${key}=`)) {
      updated = updated.replace(new RegExp(`${key}=.*`, "g"), `${key}=${val}`);
    } else {
      updated += `\n${key}=${val}`;
    }
  }

  writeFileSync(ENV_PATH, updated, "utf8");
  console.log(`\n✅ Tokens saved to .env.local`);
  console.log(`   LINKEDIN_USER_ACCESS_TOKEN = ${accessToken.slice(0, 8)}...${accessToken.slice(-8)}`);
  console.log(`   LINKEDIN_REFRESH_TOKEN     = ${refreshToken.slice(0, 8)}...${refreshToken.slice(-8)}`);
  console.log(`   LINKEDIN_TOKEN_EXPIRY      = ${expiryDate}`);
}

// ── Prompt ────────────────────────────────────────────────────────────

function ask(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans.trim()); }));
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  const env = loadEnv();
  const clientId = env["LINKEDIN_CLIENT_ID"];
  const clientSecret = env["LINKEDIN_CLIENT_SECRET"];

  if (!clientId || !clientSecret) {
    throw new Error("Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET in .env.local");
  }

  // Use a redirect_uri that matches what's registered in the LinkedIn app.
  // The redirect will likely fail (server is remote), but LinkedIn requires it.
  // We just need the `code` from the browser URL bar after authorization.
  const redirectUri = "http://localhost:3000/api/matrix/auth/linkedin/callback";
  const scope = "openid profile w_member_social w_organization_social email";

  const authUrl =
    `https://www.linkedin.com/oauth/v2/authorization` +
    `?response_type=code` +
    `&client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${STATE}`;

  console.log("═".repeat(62));
  console.log("  MyShape LinkedIn OAuth — Manual Token Acquisition");
  console.log("═".repeat(62));
  console.log("");
  console.log("👉 Step 1: Open this URL in your browser:");
  console.log("");
  console.log(`   ${authUrl}`);
  console.log("");
  console.log("👉 Step 2: Log in to LinkedIn and click 'Allow'");
  console.log("");
  console.log("👉 Step 3: LinkedIn will try to redirect to localhost:3000.");
  console.log("   It will probably fail — that's OK!");
  console.log("   Look at your browser's address bar. You'll see:");
  console.log("");
  console.log("   http://localhost:3000/.../callback?code=AQ...&state=...");
  console.log("                                       ^^^^^^^^^");
  console.log("   Copy everything after '?code=' and before '&state='");
  console.log("");

  const code = await ask("   Paste the code here: ");

  if (!code || code.length < 10) {
    throw new Error("Invalid code — should be a long string starting with 'AQ'");
  }

  console.log("");
  console.log("⏳ Exchanging code for tokens...");

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Token exchange failed: ${res.status}\n${errText.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!data.access_token) {
    throw new Error("No access_token in response:\n" + JSON.stringify(data, null, 2));
  }

  saveTokens(data.access_token, data.refresh_token || "", data.expires_in || 5184000);

  console.log("");
  console.log("🎉 LinkedIn is now connected. Restart dev server to pick up the new token.");
  console.log("   Then post via: POST /api/matrix/publish { platform: 'linkedin', ... }");
}

main().catch((err) => {
  console.error("\n❌", err instanceof Error ? err.message : err);
  process.exit(1);
});
