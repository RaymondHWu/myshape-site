// ═══════════════════════════════════════════════════════════════════
// MyShape Protocol — RN-002 Substack Article · Bluesky Thread
// ═══════════════════════════════════════════════════════════════════

import { readFileSync } from "node:fs";
import { ProxyAgent, setGlobalDispatcher } from "undici";

const proxyUrl = process.env.HTTPS_PROXY || "http://127.0.0.1:15236";
setGlobalDispatcher(new ProxyAgent({ uri: proxyUrl, requestTls: { rejectUnauthorized: false } }));

function loadEnv(path) {
  const content = readFileSync(path, "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    env[t.slice(0, eq)] = t.slice(eq + 1);
  }
  return env;
}

const env = loadEnv(".env.local");
const IDENTIFIER = env.BLUESKY_IDENTIFIER;
const PASSWORD = env.BLUESKY_PASSWORD;
const BSKY = "https://bsky.social";

async function createSession() {
  const res = await fetch(`${BSKY}/xrpc/com.atproto.server.createSession`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: IDENTIFIER, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Session failed: ${await res.text()}`);
  return res.json();
}

async function postThread(session, posts) {
  let rootUri = null, parentUri = null;
  const results = [];

  for (let i = 0; i < posts.length; i++) {
    const record = {
      $type: "app.bsky.feed.post",
      text: posts[i],
      createdAt: new Date().toISOString(),
    };

    if (parentUri && rootUri) {
      record.reply = {
        root: { uri: rootUri, cid: results[0].cid },
        parent: { uri: parentUri, cid: results[results.length - 1].cid },
      };
    }

    const res = await fetch(`${BSKY}/xrpc/com.atproto.repo.createRecord`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.accessJwt}` },
      body: JSON.stringify({ repo: session.did, collection: "app.bsky.feed.post", record }),
    });

    if (!res.ok) throw new Error(`Post ${i + 1} failed: ${await res.text()}`);

    const data = await res.json();
    results.push(data);

    if (!rootUri) rootUri = data.uri;
    parentUri = data.uri;

    const postUrl = `https://bsky.app/profile/${session.handle}/post/${data.uri.split("/").pop()}`;
    console.log(`  ✓ Post ${i + 1}/${posts.length} — ${postUrl}`);

    if (i < posts.length - 1) await new Promise((r) => setTimeout(r, 1000));
  }

  return results;
}

// ── Thread ────────────────────────────────────────────────────────

const SUBSTACK_URL = "https://myshape.substack.com/p/your-face-doesnt-matter";

const posts = [
  // Post 1 — Hook
  `Biometrics ask: "Is this the same face?"

They're asking the wrong question.

The right question: "Is there a living, breathing biological entity here right now — the same one that was here moments ago?"

New Continuity Lab post:

${SUBSTACK_URL}

🧵`,

  // Post 2 — The observation
  `We noticed something strange.

Human motion contains a kind of structured irregularity — micro-timing jitter, noise residuals, frequency spread, micro-tremors — that synthetic motion, across every generator we tested, consistently lacked.

We call it Presence Entropy.`,

  // Post 3 — The results
  `PES Benchmark v0.2 — 281 samples, 54 human subjects, 4 AI strategies:

Cohen's d = 2.1 (large effect)
AUC = 0.94
Precision = 1.00 (zero false positives)
Recall = 0.96

The entropy margin: 0.03. No overlap between lowest human and highest synthetic.`,

  // Post 4 — Boundaries
  `What this does NOT prove:

✗ Does not prove continuity over time
✗ Does not identify individuals
✗ Does not provide a security guarantee
✗ Does not claim AI can't eventually fake entropy

Current generators don't reproduce it. Future ones might. The benchmark measures whether and when.`,

  // Post 5 — Research program
  `Verification moves from pattern space to biological dynamics.

You can fake a face. You can replay a voice.

The statistical structure of living tissue is a measurement target, not a pattern to be matched.

We don't defend our results. We design the next experiment that could falsify them.`,
];

// ── Publish ────────────────────────────────────────────────────────

console.log(`[bluesky] Authenticating as ${IDENTIFIER}...`);
const session = await createSession();
console.log(`[bluesky] Logged in: @${session.handle}\n`);
console.log(`[bluesky] Publishing ${posts.length}-post thread...\n`);

await postThread(session, posts);

console.log(`\n[bluesky] ✅ Thread live: https://bsky.app/profile/${session.handle}`);
