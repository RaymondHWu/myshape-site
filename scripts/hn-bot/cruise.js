#!/usr/bin/env node

/**
 * MyShape Protocol — HN Community Cruiser v1.0
 *
 * Fetches HN top stories, filters for identity/crypto/AI topics,
 * generates technical comment drafts via Agnes AI (with fallback),
 * writes a clean HTML report to hn_feed.html
 */

const axios = require("axios");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const os = require("os");

// ── Constants ──
const HN_TOP_STORIES = "https://hacker-news.firebaseio.com/v0/topstories.json";
const HN_ITEM = (id) => `https://hacker-news.firebaseio.com/v0/item/${id}.json`;
const HN_THREAD = (id) => `https://news.ycombinator.com/item?id=${id}`;
const AGNES_URL = "https://api.agnes-ai.com/api/v1/chat/completions";

const KEYWORDS = [
  "identity", "auth", "zk", "zero.knowledge", "crypto",
  "deepfake", "deep.fake", "ai", "machine.learning", "llm",
  "privacy", "security", "motion", "presence",
  "verification", "proof", "synthetic", "simulation", "agent",
  "bot", "sybil", "personhood", "world.id", "humanity",
];

const MAX_STORIES = 150;
const MAX_COMMENTS = 8;

// ── Config ──
function loadConfig() {
  const configPath = path.join(os.homedir(), ".hermes", "config.yaml");
  if (!fs.existsSync(configPath)) {
    console.error("Config not found at", configPath);
    process.exit(1);
  }
  const cfg = yaml.load(fs.readFileSync(configPath, "utf8"));
  return {
    apiKey: cfg.model.api_key,
    model: cfg.model.default,
  };
}

const CONFIG = loadConfig();

// ── HN helpers ──
async function fetchTopStories() {
  console.log("Fetching HN top stories...");
  const { data: ids } = await axios.get(HN_TOP_STORIES, { timeout: 15000 });
  const slice = ids.slice(0, MAX_STORIES);
  console.log(`  Got ${slice.length} story IDs`);
  return slice;
}

async function fetchStory(id) {
  try {
    const { data } = await axios.get(HN_ITEM(id), { timeout: 10000 });
    return data;
  } catch { return null; }
}

function matchesKeywords(text) {
  const lower = (text || "").toLowerCase();
  return KEYWORDS.some((kw) => {
    const pattern = kw.replace(/\./g, "\\.");
    return new RegExp("\\b" + pattern + "\\b", "i").test(lower);
  });
}

// ── Comment generator ──
function fallbackComment(story, isDashboardView = true) {
  const intros = [
    "This touches on something I've been thinking about — the distinction between verifying *identity* and verifying *presence*. Most systems conflate the two, but they have fundamentally different security properties.",
    "There's an architectural assumption here worth unpacking: identity verification doesn't require knowing *who* someone is, only confirming *that they are present and real* in this moment.",
    "This reminds me of a problem at the intersection of real-time signal analysis, zero-knowledge proofs, and the limits of generative models.",
    "One thing often overlooked in these discussions is the temporal dimension. Identity isn't a snapshot — it's a continuous signal with an entropy profile that evolves over time.",
  ];
  const bodies = [
    "Most authentication treats identity as a static credential — something you have or know. Shift the primitive to something you continuously generate, and the attack surface changes. You're no longer guarding a secret; you're proving an ongoing physical process. That's a fundamentally different security model with different failure modes.",
    "The entropy source matters more than the proof system. A ZK proof of a low-entropy signal is still forgeable. The hard problem isn't the circuit — it's finding a witness that AI cannot fabricate at the distribution level. My intuition: this requires an open-loop biological noise source no current architecture models end-to-end.",
    "From a protocol design perspective, the question isn't 'can we detect AI' but 'what primitive can a human generate that no model reproduces at scale.' The answer likely involves irreversible, high-entropy, real-time biological processes — things resisting compression into latent space.",
  ];
  const endings = [
    "Has anyone explored the entropy gap between synthetic and biological micro-motion as a quantifiable security parameter?",
    "What's the state of the art for non-biometric, real-time human presence verification that doesn't rely on trusted hardware?",
    "Anyone aware of research quantifying minimum entropy thresholds needed to distinguish biological from synthetic signals at scale?",
  ];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const en = pick(intros) + "\n\n" + pick(bodies) + "\n\n" + pick(endings);
  if (!isDashboardView) return en;
  return "[English]\n" + en + "\n\n[中文]\n（中文翻译待 API 恢复后生成 / Chinese translation pending API recovery）";
}

async function generateComment(story, isDashboardView = true) {
  const formatInstr = isDashboardView
    ? "\nOutput format: [English] section first, then [中文] section with complete Chinese translation."
    : " Output in English only.";

  const prompt = `Analyze this HN thread through MyShape Protocol's lens and write a technical commentary (140-200 words, 3-4 paragraphs). Structure: (1) What the news signals about the identity/verification landscape — 1 sentence. (2) Protocol-First analysis — map to MyShape's Continuity Layer (why temporal continuity defeats snapshot-based auth) or Presence Receipt (why real-time motion-signature verification is the correct primitive). (3) Non-obvious technical insight. (4) Open question that challenges assumptions. Tone: terse, precise, slightly contrarian.${formatInstr} Thread title: "${story.title}"`;

  const systemFormat = isDashboardView
    ? " Output format must ALWAYS be: [English] content first, then [中文] translation."
    : " Output in English only.";

  try {
    const res = await axios.post(AGNES_URL, {
      model: CONFIG.model,
      messages: [
        { role: "system", content: "You are the Lead Architect Agent for MyShape Protocol. Provide a 'Protocol-First' perspective on industry news — compare against MyShape's Continuity Layer (temporal identity integrity — identity is not a snapshot but a continuous signal) and Presence Receipt (real-time human verification via motion-signature, not biometrics). Use a founder-level, insightful tone. Write in the style of a seasoned Hacker News commenter: terse, technically precise, slightly contrarian. Never mention product names." + systemFormat },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + CONFIG.apiKey,
      },
      timeout: 30000,
    });
    const text = res.data.choices[0].message.content.trim();
    if (text && text.length > 50) return text;
  } catch (err) {
    console.log("  API unavailable (" + (err.response?.status || err.code) + "), using fallback");
  }
  return fallbackComment(story, isDashboardView);
}

// ── HTML report ──
function generateHtml(results) {
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const rows = results.map((r) =>
    '<div class="card">' +
    '<div class="title"><a href="' + r.url + '" target="_blank">' + esc(r.title) + '</a>' +
    '<span class="meta">' + r.score + ' pts &middot; ' + (r.descendants || 0) + ' comments</span></div>' +
    '<div class="comment">' + esc(r.comment) + '</div></div>'
  ).join("\n");

  return '<!DOCTYPE html>\n<html lang="zh-CN"><head><meta charset="UTF-8">' +
    '<title>MyShape HN Feed — ' + now + '</title>' +
    '<style>body {margin:40px;background:#0a0f14;color:#c9d1d9;font-family:system-ui,-apple-system,sans-serif}' +
    'h1{color:#58a6ff;font-weight:300;letter-spacing:.1em}.meta-bar{color:#8b949e;font-size:12px;margin-bottom:30px}' +
    '.card{border:1px solid #21262d;border-radius:6px;padding:20px;margin-bottom:16px;background:#0d1117}' +
    '.title{margin-bottom:12px}.title a{color:#58a6ff;text-decoration:none;font-size:14px;font-weight:600}' +
    '.title a:hover{text-decoration:underline}.meta{color:#484f58;font-size:11px;margin-left:12px}' +
    '.comment{color:#8b949e;font-size:12px;line-height:1.7;white-space:pre-wrap}' +
    '.comment::before{content:"协议评论 / Protocol Commentary";display:block;color:#3fb950;font-size:10px;margin-bottom:8px;text-transform:uppercase;letter-spacing:.15em}' +
    '.bilingual-hint{color:#30363d;font-size:10px;margin-top:10px;font-style:italic}' +
    '.footer{margin-top:40px;color:#30363d;font-size:10px;text-align:center}</style></head><body>' +
    '<h1>MyShape Protocol — HN Feed <span style="font-size:14px;color:#6e7681;">| 协议情报</span></h1>' +
    '<div class="meta-bar">Generated / 生成时间: ' + now + ' UTC &middot; ' + results.length + ' threads matched / 条匹配</div>' +
    rows +
    '<div class="footer">MyShape Protocol &middot; HN Community Cruiser v1.0 &middot; Protocol-First Analysis &middot; 协议优先分析</div></body></html>';
}

function esc(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// ── Main ──
async function main() {
  console.log("=".repeat(60));
  console.log("  MyShape Protocol — HN Community Cruiser");
  console.log("=".repeat(60) + "\n");

  const ids = await fetchTopStories();
  const stories = [];
  for (const id of ids) {
    const s = await fetchStory(id);
    if (!s) continue;
    if (matchesKeywords([s.title, s.text || ""].join(" "))) {
      stories.push(s);
      if (stories.length >= MAX_COMMENTS) break;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log("Matched " + stories.length + " stories\n");

  if (!stories.length) {
    console.log("No matches. Try again later.");
    process.exit(0);
  }

  const results = [];
  for (let i = 0; i < stories.length; i++) {
    const s = stories[i];
    console.log("[" + (i + 1) + "/" + stories.length + '] "' + s.title.slice(0, 60) + '..."');
    const comment = await generateComment(s);
    if (comment) {
      results.push({
        id: s.id, title: s.title,
        url: HN_THREAD(s.id),
        score: s.score || 0,
        descendants: s.descendants || 0,
        comment,
      });
      console.log("  Done (" + comment.length + " chars)");
    }
    if (i < stories.length - 1) await new Promise((r) => setTimeout(r, 1500));
  }

  const outPath = path.join(__dirname, "hn_feed.html");
  fs.writeFileSync(outPath, generateHtml(results), "utf8");
  console.log("\nReport -> " + outPath);
  console.log(results.length + " drafts ready.\n");
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
