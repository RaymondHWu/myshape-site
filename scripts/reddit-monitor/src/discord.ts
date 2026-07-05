// ═══════════════════════════════════════════════════════════════════
// MyShape Reddit Monitor — Discord Webhook
// ═══════════════════════════════════════════════════════════════════
//
// Formats new Reddit posts as Discord Embeds with keyword-based
// color coding for at-a-glance filtering.

import type { ParsedItem } from "./rss";
import { getDiscordWebhookUrl } from "./config";

// ── Color Rules ────────────────────────────────────────────────────
//
// Match title + feed keywords against these patterns.
// First match wins. Default: ICE_BLUE.

interface ColorRule {
  keywords: string[];
  color: number;    // decimal
  label: string;
}

const COLOR_RULES: ColorRule[] = [
  { keywords: ["security", "auth", "rls", "vulnerability", "cve", "breach"], color: 0xef4444, label: "SEC" },    // red
  { keywords: ["performance", "benchmark", "slow", "latency", "optimize"], color: 0x22c55e, label: "PERF" },       // green
  { keywords: ["edge function", "edge", "serverless", "lambda"], color: 0xa855f7, label: "EDGE" },                // purple
  { keywords: ["migration", "migrate", "upgrade", "pg_upgrade"], color: 0xf59e0b, label: "MIG" },                 // amber
  { keywords: ["docker", "selfhost", "deploy", "docker-compose", "proxy", "nginx"], color: 0x3b82f6, label: "OPS" }, // blue
];

const DEFAULT_COLOR = 0x90c8ff; // Ice blue — MyShape brand
const DEFAULT_LABEL = "RSS";

function classify(item: ParsedItem): { color: number; label: string } {
  const searchText = `${item.title} ${item.feedKeywords.join(" ")}`.toLowerCase();

  for (const rule of COLOR_RULES) {
    if (rule.keywords.some((kw) => searchText.includes(kw.toLowerCase()))) {
      return { color: rule.color, label: rule.label };
    }
  }

  return { color: DEFAULT_COLOR, label: DEFAULT_LABEL };
}

// ── Send ───────────────────────────────────────────────────────────

interface DiscordEmbed {
  title: string;
  url: string;
  description: string;
  color: number;
  timestamp: string;
  footer: { text: string };
  author: { name: string };
}

const MAX_EMBEDS_PER_CALL = 10; // Discord webhook limit

export async function sendToDiscord(items: ParsedItem[]): Promise<void> {
  if (items.length === 0) return;

  const webhookUrl = getDiscordWebhookUrl();
  const embeds: DiscordEmbed[] = items.map((item) => {
    const { color, label } = classify(item);

    return {
      title: item.title,
      url: item.link,
      description: [
        `📰 New post in **${item.feedName}**`,
        `👤 ${item.author}`,
        `🏷 ${label}`,
      ].join("\n"),
      color,
      timestamp: new Date(item.pubDate).toISOString(),
      footer: {
        text: `${item.feedName} · RSS Monitor`,
      },
      author: {
        name: `🔴 ${item.feedName}`,
      },
    };
  });

  // Send in batches of 10 (Discord webhook limit)
  let sent = 0;
  for (let i = 0; i < embeds.length; i += MAX_EMBEDS_PER_CALL) {
    const batch = embeds.slice(i, i + MAX_EMBEDS_PER_CALL);
    const payload = { content: null, embeds: batch };

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.text();
        console.error(`[discord] Webhook returned ${res.status}: ${body.slice(0, 200)}`);
        continue;
      }

      sent += batch.length;
      // Small delay between batches to avoid rate limiting
      if (i + MAX_EMBEDS_PER_CALL < embeds.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[discord] Webhook failed: ${message}`);
    }
  }

  console.log(`[discord] Sent ${sent}/${items.length} notification(s)`);
}
