// ═══════════════════════════════════════════════════════════════════
// MyShape Feedback Monitor — HN (Algolia Search API)
// ═══════════════════════════════════════════════════════════════════
//
// Free, no auth required. Searches comments and posts mentioning
// MyShape-related keywords. Returns new items since last check.

import { SEARCH_KEYWORDS, TITLE_FILTER, PROXY_URI } from "./config";

export interface HnMatch {
  objectID: string;
  title: string;
  url: string;          // hn.algolia.com link → redirects to HN
  story_title?: string;
  story_url?: string;
  comment_text?: string;
  author: string;
  created_at: string;
  points?: number;
  num_comments?: number;
  type: "comment" | "story";
}

const HN_API = "https://hn.algolia.com/api/v1";

interface AlgoliaHit {
  objectID: string;
  title?: string;
  url?: string;
  story_title?: string;
  story_url?: string;
  comment_text?: string;
  author: string;
  created_at: string;
  points?: number;
  num_comments?: number;
}

function buildFetch(): typeof fetch {
  if (!PROXY_URI) return fetch;

  // Dynamic import undici for proxy support
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const { ProxyAgent, fetch: ufetch } = await import("undici");
    const dispatcher = new ProxyAgent({
      uri: PROXY_URI,
      requestTls: { rejectUnauthorized: false },
    });
    return ufetch(input as string, {
      ...init,
      dispatcher,
    } as Parameters<typeof ufetch>[1]) as unknown as Response;
  };
}

export async function searchHN(
  keyword: string,
  since: string, // ISO timestamp
): Promise<HnMatch[]> {
  const f = buildFetch();
  const query = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(keyword)}&tags=(comment,story)&hitsPerPage=25&numericFilters=created_at_i>${Math.floor(new Date(since).getTime() / 1000)}`;

  try {
    const res = await f(query);
    if (!res.ok) throw new Error(`HN API: ${res.status}`);
    const data = (await res.json()) as { hits: AlgoliaHit[] };

    return data.hits.map((h) => ({
      objectID: h.objectID,
      title: h.title || h.story_title || "(untitled)",
      url: h.url || h.story_url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      story_title: h.story_title,
      story_url: h.story_url,
      comment_text: h.comment_text,
      author: h.author,
      created_at: h.created_at,
      points: h.points,
      num_comments: h.num_comments,
      type: h.comment_text ? "comment" : "story",
    }));
  } catch (err) {
    console.error("[hn]", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function searchAllHN(since: string): Promise<HnMatch[]> {
  const all: HnMatch[] = [];
  const seen = new Set<string>();

  for (const kw of SEARCH_KEYWORDS) {
    const hits = await searchHN(kw, since);
    for (const h of hits) {
      if (!seen.has(h.objectID)) {
        seen.add(h.objectID);
        all.push(h);
      }
    }
    if (SEARCH_KEYWORDS.indexOf(kw) < SEARCH_KEYWORDS.length - 1) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Post-filter: only keep items with relevant titles
  const filtered = all.filter((h) => {
    const text = `${h.title} ${h.story_title || ""} ${h.comment_text || ""}`.toLowerCase();
    return TITLE_FILTER.some((kw) => text.includes(kw.toLowerCase()));
  });

  console.log(`[hn] ${filtered.length} relevant (${all.length} raw)`);
  return filtered;
}
