// ═══════════════════════════════════════════════════════════════════
// MyShape Reddit Monitor — Configuration
// ═══════════════════════════════════════════════════════════════════

import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export interface FeedConfig {
  /** Display name (used in Discord embed footer) */
  name: string;
  /** Reddit RSS feed URL (.rss suffix) */
  url: string;
  /** Keywords that trigger special embed coloring */
  keywords?: string[];
}

/** Monitored subreddit feeds — MyShape-relevant communities */
export const FEEDS: FeedConfig[] = [
  {
    name: "r/MachineLearning",
    url: "https://www.reddit.com/r/MachineLearning/new/.rss",
    keywords: ["motion", "pose", "skeleton", "kinematic", "human", "diffusion", "generative", "deepfake", "detection", "biometric", "identity", "verification", "zero-knowledge", "zk", "personhood"],
  },
  {
    name: "r/rust",
    url: "https://www.reddit.com/r/rust/new/.rss",
    keywords: ["crypto", "cryptography", "wasm", "fft", "nalgebra", "signal", "identity", "security", "benchmark"],
  },
  {
    name: "r/computervision",
    url: "https://www.reddit.com/r/computervision/new/.rss",
    keywords: ["pose", "skeleton", "motion", "human", "mediapipe", "landmark", "tracking", "3d", "reconstruction", "detection"],
  },
  {
    name: "r/crypto",
    url: "https://www.reddit.com/r/crypto/new/.rss",
    keywords: ["zk", "zero-knowledge", "proof", "signature", "identity", "commitment", "circuit", "zkp"],
  },
  {
    name: "r/privacy",
    url: "https://www.reddit.com/r/privacy/new/.rss",
    keywords: ["identity", "sovereign", "self-sovereign", "decentralized", "biometric", "verification", "proof", "personhood"],
  },
];

/** Polling interval in minutes */
export const POLL_INTERVAL_MINUTES = 15;

/** RSS fetch timeout in milliseconds */
export const FETCH_TIMEOUT_MS = 10_000;

/** Maximum GUIDs to retain in dedup store */
export const MAX_DEDUP_ENTRIES = 1000;

/** Discord webhook URL (from environment) */
export function getDiscordWebhookUrl(): string {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    throw new Error("DISCORD_WEBHOOK_URL environment variable is not set");
  }
  return url;
}

/** Dedup file path (resolved relative to this config file) */
export const DEDUP_FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "seen.json",
);
