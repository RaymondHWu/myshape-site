// ═══════════════════════════════════════════════════════════════════
// MyShape Reddit Monitor — Deduplication Store
// ═══════════════════════════════════════════════════════════════════
//
// Persists seen GUIDs to a local JSON file. Uses atomic write
// (temp file + rename) to prevent corruption on crash.

import { readFile, writeFile, rename, access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
import { DEDUP_FILE, MAX_DEDUP_ENTRIES } from "./config";

let store: Set<string> | null = null;
let dirty = false;

/** Load seen GUIDs from disk */
async function load(): Promise<Set<string>> {
  try {
    await access(DEDUP_FILE);
    const raw = await readFile(DEDUP_FILE, "utf-8");
    const arr: string[] = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    // File doesn't exist or is corrupt — start fresh
    return new Set();
  }
}

/** Get the store, loading from disk on first access */
export async function getStore(): Promise<Set<string>> {
  if (!store) {
    store = await load();
  }
  return store;
}

/** Check if a GUID has already been processed */
export async function isSeen(guid: string): Promise<boolean> {
  const s = await getStore();
  return s.has(guid);
}

/** Mark a GUID as processed and persist */
export async function markSeen(guid: string): Promise<void> {
  const s = await getStore();
  if (s.has(guid)) return;
  s.add(guid);

  // Trim oldest entries if over limit
  if (s.size > MAX_DEDUP_ENTRIES) {
    const toRemove = s.size - MAX_DEDUP_ENTRIES;
    let removed = 0;
    for (const key of s) {
      if (removed >= toRemove) break;
      s.delete(key);
      removed++;
    }
  }

  dirty = true;
}

/** Persist to disk (atomic write: temp + rename) */
export async function flush(): Promise<void> {
  if (!dirty || !store) return;

  const arr = Array.from(store);
  // Write temp file to same directory as target (same device = atomic rename)
  const tmpFile = join(dirname(DEDUP_FILE), `.seen-${randomBytes(4).toString("hex")}.tmp`);

  // Write to temp file first
  await writeFile(tmpFile, JSON.stringify(arr), "utf-8");

  // Atomic rename — no window where the file is half-written
  await rename(tmpFile, DEDUP_FILE);

  dirty = false;
}
