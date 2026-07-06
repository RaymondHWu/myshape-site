// ═══════════════════════════════════════════════════════════════════
// MyShape API Monitor — Dev endpoint error watcher
// ═══════════════════════════════════════════════════════════════════
//
// Usage:
//   npx tsx index.ts              → scan once and push to Discord
//   npx tsx index.ts --daemon 60  → scan every 60 seconds
//
// Watches PM2 logs for [dev/register] and [dev/activate] errors.
// Deduplicates by error message within a 10-minute window.
// Pushes alerts to Discord via DISCORD_WEBHOOK_URL.

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const STATE_FILE = `${__dirname}/seen.json`;
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const DEDUP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

interface SeenEntry {
  key: string;
  lastSeen: number;
}

function loadSeen(): Map<string, number> {
  const map = new Map<string, number>();
  try {
    if (existsSync(STATE_FILE)) {
      const entries: SeenEntry[] = JSON.parse(readFileSync(STATE_FILE, "utf-8"));
      for (const e of entries) {
        if (Date.now() - e.lastSeen < DEDUP_WINDOW_MS) map.set(e.key, e.lastSeen);
      }
    }
  } catch { /* fresh start */ }
  return map;
}

function saveSeen(map: Map<string, number>): void {
  const dir = dirname(STATE_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const entries: SeenEntry[] = [];
  for (const [key, lastSeen] of map) entries.push({ key, lastSeen });
  writeFileSync(STATE_FILE, JSON.stringify(entries, null, 2));
}

async function sendDiscordAlert(
  title: string,
  lines: string[],
  color: number = 0xef4444,
): Promise<void> {
  if (!WEBHOOK_URL) {
    console.error("[api-monitor] DISCORD_WEBHOOK_URL not set — cannot send alert");
    return;
  }

  const body = {
    embeds: [
      {
        title,
        color,
        description: lines.map((l) => `\`\`\`\n${l.slice(0, 500)}\n\`\`\``).join("\n"),
        footer: { text: `MyShape API Monitor · ${new Date().toISOString()}` },
      },
    ],
  };

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`[api-monitor] Discord webhook returned ${res.status}`);
    }
  } catch (err) {
    console.error("[api-monitor] Discord webhook failed:", (err as Error).message);
  }
}

function fetchLogs(): string {
  try {
    // Get last 80 lines from all PM2 processes
    return execSync("npx pm2 logs --nostream --lines 80 --raw 2>&1", {
      encoding: "utf-8",
      timeout: 10_000,
      windowsHide: true,
    });
  } catch {
    return "";
  }
}

const CRASH_PATTERNS = [
  /\[dev\/register\]\s+Crash:/i,
  /\[dev\/activate\]\s+Crash:/i,
  /REGISTRATION_FAILED/i,
  /ACTIVATION_FAILED/i,
  /SERVER_CONFIG_ERROR/i,
];

// Operational signals — not errors, but worth tracking
const SIGNAL_PATTERNS = [
  /\[dev\/register\]\s+409\s+HANDLE_TAKEN/i,
  /\[dev\/register\]\s+429\s+COOLDOWN/i,
];

async function scan(): Promise<void> {
  const logs = fetchLogs();
  if (!logs) return;

  const seen = loadSeen();
  const alerts: Array<{ title: string; lines: string[]; color: number }> = [];

  for (const line of logs.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let matched = false;

    // Crash patterns → red alert
    for (const pattern of CRASH_PATTERNS) {
      if (pattern.test(trimmed)) {
        const key = trimmed.slice(0, 80);
        if (!seen.has(key)) {
          seen.set(key, Date.now());
          alerts.push({
            title: "🚨 Dev API Error",
            lines: extractContext(logs, trimmed),
            color: 0xef4444,
          });
        }
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Signal patterns → blue info (only every 5min to avoid spam)
    for (const pattern of SIGNAL_PATTERNS) {
      if (pattern.test(trimmed)) {
        const key = `signal:${trimmed.slice(0, 60)}`;
        const last = seen.get(key);
        if (!last || Date.now() - last > 5 * 60_000) {
          seen.set(key, Date.now());
          alerts.push({
            title: "📊 Dev API Signal",
            lines: extractContext(logs, trimmed),
            color: 0x3b82f6,
          });
        }
        matched = true;
        break;
      }
    }
  }

  saveSeen(seen);

  for (const alert of alerts) {
    const prefix = alert.color === 0xef4444 ? "ALERT" : "SIGNAL";
    console.log(`[api-monitor] ${prefix}: ${alert.lines[0]}`);
    await sendDiscordAlert(alert.title, alert.lines, alert.color);
  }

  if (alerts.length === 0) {
    console.log(`[api-monitor] Scan complete — no new errors (${new Date().toISOString()})`);
  }
}

function extractContext(logs: string, matchLine: string): string[] {
  const lines = logs.split("\n");
  const idx = lines.findIndex((l) => l.includes(matchLine.slice(0, 60)));
  if (idx === -1) return [matchLine];
  const start = Math.max(0, idx - 2);
  const end = Math.min(lines.length, idx + 3);
  return lines.slice(start, end);
}

// ── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const isDaemon = args.includes("--daemon");
  const intervalSec = parseInt(args[args.indexOf("--daemon") + 1] || "60", 10);

  console.log(`[api-monitor] Started${isDaemon ? ` (daemon, ${intervalSec}s interval)` : " (once)"}`);

  await scan();

  if (isDaemon) {
    setInterval(() => scan(), intervalSec * 1000);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("[api-monitor] Fatal:", err);
  process.exit(1);
});
