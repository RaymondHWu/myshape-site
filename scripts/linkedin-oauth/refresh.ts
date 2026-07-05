// ═══════════════════════════════════════════════════════════════════
// MyShape LinkedIn OAuth — Token Refresh
// ═══════════════════════════════════════════════════════════════════
//
// Usage:
//   npx tsx scripts/linkedin-oauth/refresh.ts
//
// Reads LINKEDIN_REFRESH_TOKEN + LINKEDIN_CLIENT_ID + LINKEDIN_CLIENT_SECRET
// from .env.local, exchanges refresh token for a new access token, and
// writes the updated LINKEDIN_USER_ACCESS_TOKEN back to .env.local.
//
// LinkedIn access tokens expire in 60 days. Refresh tokens last 365 days.
// Each refresh rotates the refresh token (new one returned).

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ENV_PATH = resolve(process.cwd(), ".env.local");

// ── Load .env.local ──────────────────────────────────────────────────

function loadEnv(): Record<string, string> {
  if (!existsSync(ENV_PATH)) {
    throw new Error(`.env.local not found at ${ENV_PATH}`);
  }
  const content = readFileSync(ENV_PATH, "utf8");
  const vars: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0 && !line.trim().startsWith("#")) {
      vars[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
    }
  }
  return vars;
}

function saveEnv(env: Record<string, string>): void {
  const lines: string[] = [];
  const seen = new Set<string>();
  const raw = readFileSync(ENV_PATH, "utf8").split("\n");

  for (const line of raw) {
    const eq = line.indexOf("=");
    if (eq > 0 && !line.trim().startsWith("#")) {
      const key = line.slice(0, eq).trim();
      if (env[key] !== undefined) {
        lines.push(`${key}=${env[key]}`);
        seen.add(key);
        continue;
      }
    }
    lines.push(line);
  }

  // Append any new keys not in original file
  for (const [key, value] of Object.entries(env)) {
    if (!seen.has(key)) {
      lines.push(`${key}=${value}`);
    }
  }

  writeFileSync(ENV_PATH, lines.join("\n") + "\n", "utf8");
}

// ── Refresh ──────────────────────────────────────────────────────────

async function refresh(): Promise<void> {
  const env = loadEnv();

  const clientId = env["LINKEDIN_CLIENT_ID"];
  const clientSecret = env["LINKEDIN_CLIENT_SECRET"];
  const refreshToken = env["LINKEDIN_REFRESH_TOKEN"];

  if (!clientId || !clientSecret) {
    throw new Error("Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET in .env.local");
  }
  if (!refreshToken) {
    throw new Error("Missing LINKEDIN_REFRESH_TOKEN in .env.local. Run OAuth authorization first.");
  }

  console.log("[refresh] Exchanging refresh token for new access token...");

  const params = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
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
    throw new Error(`Token refresh failed: ${res.status} — ${errText.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!data.access_token) {
    throw new Error("No access_token in response: " + JSON.stringify(data));
  }

  // Update .env.local
  env["LINKEDIN_USER_ACCESS_TOKEN"] = data.access_token;
  if (data.refresh_token) {
    env["LINKEDIN_REFRESH_TOKEN"] = data.refresh_token;
  }
  if (data.expires_in) {
    env["LINKEDIN_TOKEN_EXPIRY"] = new Date(Date.now() + data.expires_in * 1000)
      .toISOString()
      .slice(0, 10);
  }
  saveEnv(env);

  console.log(`[refresh] ✅ Token refreshed successfully`);
  console.log(`[refresh]    Access token:  ${data.access_token.slice(0, 8)}...${data.access_token.slice(-8)}`);
  if (data.refresh_token) {
    console.log(`[refresh]    Refresh token: ${data.refresh_token.slice(0, 8)}...${data.refresh_token.slice(-8)} (rotated)`);
  }
  console.log(`[refresh]    Expires:       ${env["LINKEDIN_TOKEN_EXPIRY"] || "unknown"}`);
  console.log(`[refresh]    Saved to:      .env.local`);
}

refresh().catch((err) => {
  console.error("[refresh] ❌", err instanceof Error ? err.message : err);
  process.exit(1);
});
