// ═══════════════════════════════════════════════════════════════════
// MyShape Reddit Monitor — Dry-Run Test
// ═══════════════════════════════════════════════════════════════════
//
// Usage: npx tsx src/test-feeds.ts
//
// Fetches all configured feeds and prints what WOULD be sent.
// No Discord webhook is called. No dedup state is written.

import { FEEDS } from "./config";
import { fetchFeed } from "./rss";

async function test() {
  console.log(`Testing ${FEEDS.length} feed(s)...\n`);

  let first = true;
  for (const config of FEEDS) {
    // 5s pause between feeds to avoid Reddit 429 rate limiting
    if (!first) await new Promise((r) => setTimeout(r, 5000));
    first = false;

    console.log(`─`.repeat(40));
    console.log(`Feed: ${config.name}`);
    console.log(`URL:  ${config.url}`);

    const items = await fetchFeed(config);

    if (items.length === 0) {
      console.log("Result: No items (or fetch failed)\n");
      continue;
    }

    console.log(`Got ${items.length} item(s):\n`);
    for (const item of items.slice(0, 3)) {
      console.log(`  📌 ${item.title}`);
      console.log(`     ${item.link}`);
      console.log(`     ${item.author} · ${item.pubDate}`);
      console.log();
    }

    if (items.length > 3) {
      console.log(`  ... and ${items.length - 3} more\n`);
    }
  }
}

test().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
