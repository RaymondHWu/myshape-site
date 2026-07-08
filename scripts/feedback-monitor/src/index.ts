// ═══════════════════════════════════════════════════════════════════
// MyShape Feedback Monitor — Main Loop
// ═══════════════════════════════════════════════════════════════════
//
// Usage:
//   npx tsx src/index.ts           → scan once and push to Discord
//   npx tsx src/index.ts --daemon  → run every N minutes
//   npx tsx src/index.ts --dry     → scan without Discord push
//
// Monitors: HN (Algolia), GitHub (gh CLI), Reddit (search RSS)
// All results formatted as Discord embeds and pushed to webhook.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import cron from "node-cron";
import { ProxyAgent, setGlobalDispatcher } from "undici";

import { POLL_INTERVAL_MINUTES, STATE_FILE, getDevLogsWebhookUrl } from "./config";
import { searchAllHN, type HnMatch } from "./hn";
import { getAllEvents, type GitHubEvent, type GitHubStats } from "./github";
import { searchReddit, type RedditMention } from "./reddit";
import {
  sendToDiscord,
  formatHnMatches,
  formatGitHubStats,
  formatGitHubEvents,
  formatRedditMentions,
} from "./discord";

// ── Proxy setup ──────────────────────────────────────────────────────

const proxy = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
if (proxy) {
  setGlobalDispatcher(new ProxyAgent({ uri: proxy, requestTls: { rejectUnauthorized: false } }));
}

// ── State persistence ────────────────────────────────────────────────

interface State {
  lastRun: string; // ISO timestamp
}

function loadState(): State {
  try {
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, "utf8")) as State;
    }
  } catch { /* corrupt — start fresh */ }
  return { lastRun: new Date(0).toISOString() };
}

function saveState(state: State): void {
  const dir = dirname(STATE_FILE);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");
}

// ── Main scan ────────────────────────────────────────────────────────

interface ScanResult {
  hn: HnMatch[];
  githubStats: GitHubStats[];
  githubEvents: GitHubEvent[];
  reddit: RedditMention[];
}

async function scan(): Promise<ScanResult> {
  const state = loadState();
  const since = state.lastRun;
  const now = new Date().toISOString();

  console.log(`\n[monitor] Scanning since ${since.slice(0, 19)}Z`);

  // Fetch all sources in parallel
  const [hn, github, reddit] = await Promise.all([
    searchAllHN(since),
    Promise.resolve(getAllEvents()),
    searchReddit(new Date(since)),
  ]);

  // Update state
  saveState({ lastRun: now });

  return {
    hn,
    githubStats: github.stats,
    githubEvents: github.events,
    reddit,
  };
}

async function runOnce(dryRun = false): Promise<void> {
  const result = await scan();

  const totalItems = result.hn.length + result.githubEvents.length + result.reddit.length;
  console.log(`[monitor] Total: ${totalItems} new item(s)`);

  if (totalItems === 0) {
    console.log("[monitor] Nothing to report");
    return;
  }

  if (dryRun) {
    console.log("\n── DRY RUN ──");
    for (const h of result.hn) {
      console.log(`  ▲ HN: ${h.title.slice(0, 80)} — ${h.author}`);
    }
    for (const e of result.githubEvents) {
      console.log(`  🐙 GitHub: ${e.type} — ${e.title?.slice(0, 60) || e.repo} — ${e.author}`);
    }
    for (const r of result.reddit) {
      console.log(`  🔴 Reddit: r/${r.subreddit} — ${r.title.slice(0, 80)}`);
    }
    return;
  }

  // GitHub → #dev-logs (merged stats + events, single call)
  try {
    const ghEmbeds: any[] = [];
    if (result.githubStats.length > 0) ghEmbeds.push(formatGitHubStats(result.githubStats));
    if (result.githubEvents.length > 0) ghEmbeds.push(...formatGitHubEvents(result.githubEvents));
    if (ghEmbeds.length > 0) {
      const devLogsUrl = getDevLogsWebhookUrl();
      await sendToDiscord(ghEmbeds, "GitHub", devLogsUrl);
    }
  } catch (err) {
    console.error("[monitor] GitHub→#dev-logs failed:", (err as Error).message);
  }

  // HN + Reddit → #vision
  if (result.hn.length > 0) {
    await sendToDiscord(formatHnMatches(result.hn), "HN");
  }

  if (result.reddit.length > 0) {
    await sendToDiscord(formatRedditMentions(result.reddit), "Reddit");
  }

  console.log("[monitor] Done");
}

// ── Entry ────────────────────────────────────────────────────────────

const isDaemon = process.argv.includes("--daemon");
const isDry = process.argv.includes("--dry");

if (isDaemon) {
  const cronExpr = `*/${POLL_INTERVAL_MINUTES} * * * *`;
  console.log(`[monitor] Daemon mode — every ${POLL_INTERVAL_MINUTES} min`);
  console.log(`[monitor] State: ${STATE_FILE}`);

  runOnce(isDry).catch(console.error);

  cron.schedule(cronExpr, () => {
    runOnce(isDry).catch((err) => console.error("[monitor] Cycle error:", err));
  });
} else {
  runOnce(isDry)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[monitor] Fatal:", err);
      process.exit(1);
    });
}
