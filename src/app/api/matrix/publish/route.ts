import { NextResponse } from "next/server";

/**
 * POST /api/matrix/publish
 *
 * Dual-mode publish endpoint:
 * - Bluesky: full ATP protocol push via @atproto/api
 * - LinkedIn: placeholder (LinkedIn API v2 requires OAuth user token)
 * - LINK-type platforms are handled client-side (clipboard + window.open)
 *
 * Payload: { platform, content, title, url, publishType }
 */
export async function POST(request: Request) {
  try {
    const { platform, content, title, url } = await request.json();

    if (!platform || !content) {
      return NextResponse.json(
        { success: false, error: "MISSING_FIELDS: platform and content required" },
        { status: 400 },
      );
    }

    const result: Record<string, unknown> = {
      platform,
      title: title || "",
      content_length: content.length,
      timestamp: new Date().toISOString(),
    };

    // ── Bluesky ──
    if (platform === "bluesky") {
      const identifier = process.env.BLUESKY_IDENTIFIER || process.env.BLUESKY_HANDLE;
      const password = process.env.BLUESKY_PASSWORD;

      if (!identifier || !password) {
        result.status = "SKIPPED";
        result.error = "BLUESKY_CREDENTIALS_MISSING";
        console.log("[matrix/publish] Bluesky skipped — missing BLUESKY_IDENTIFIER or BLUESKY_PASSWORD");
        return NextResponse.json({ success: false, ...result });
      }

      try {
        // 自动检测代理
        let proxyUri = "http://127.0.0.1:15236";
        const { execSync } = await import("child_process");
        try {
          execSync('netstat -ano | findstr "127.0.0.1:7890.*LISTENING"', { timeout: 1000, stdio: "ignore" });
          proxyUri = "http://127.0.0.1:7890";
        } catch { /* VEE default */ }

        const { ProxyAgent, fetch: undiciFetch } = await import("undici");
        const dispatcher = new ProxyAgent(proxyUri);
        const bfetch = (url: string, init?: RequestInit) =>
          undiciFetch(url, { ...init, dispatcher } as Parameters<typeof undiciFetch>[1]);

        // ① 登录：POST /xrpc/com.atproto.server.createSession
        const loginRes = await bfetch(
          "https://bsky.social/xrpc/com.atproto.server.createSession",
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier: identifier.trim(), password: password.trim() }) },
        );
        if (!loginRes.ok) {
          const errText = await loginRes.text();
          throw new Error("Bluesky login failed: " + loginRes.status + " " + errText.slice(0, 100));
        }
        const session = await loginRes.json() as { accessJwt: string; did: string };

        // ② 发帖：POST /xrpc/com.atproto.repo.createRecord
        const truncated = content.length > 290 ? content.slice(0, 287) + "..." : content;
        const postBody = {
          repo: session.did,
          collection: "app.bsky.feed.post",
          record: { text: truncated, createdAt: new Date().toISOString() },
        };
        const postRes = await bfetch(
          "https://bsky.social/xrpc/com.atproto.repo.createRecord",
          { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + session.accessJwt }, body: JSON.stringify(postBody) },
        );
        if (!postRes.ok) {
          const errText = await postRes.text();
          throw new Error("Bluesky post failed: " + postRes.status + " " + errText.slice(0, 100));
        }
        const postData = await postRes.json() as { uri: string; cid: string };

        result.status = "PUBLISHED";
        result.platform_post_id = postData.uri;
        console.log("[matrix/publish] Bluesky published:", postData.uri);
        return NextResponse.json({ success: true, ...result });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown Bluesky error";
        result.status = "FAILED";
        result.error = msg;
        console.error("[matrix/publish] Bluesky error:", msg);
        return NextResponse.json({ success: false, ...result });
      }
    }

    // ── LinkedIn ──
    if (platform === "linkedin") {
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
      // LinkedIn requires OAuth2 user token — not yet implemented
      // For now: log + return preview status
      if (!clientId || !clientSecret) {
        result.status = "SKIPPED";
        result.error = "LINKEDIN_CREDENTIALS_MISSING";
        console.log("[matrix/publish] LinkedIn skipped — missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET");
      } else {
        result.status = "PREVIEW";
        result.note = "LinkedIn OAuth2 user token not configured. Credentials found — ready for next phase.";
        console.log("[matrix/publish] LinkedIn preview:", JSON.stringify({ title, content_length: content.length }));
      }
      return NextResponse.json({ success: true, ...result });
    }

    // ── Unknown / LINK-type platforms ──
    result.status = "PREVIEW";
    result.note = "LINK-type platform — handled client-side via clipboard + window.open";
    console.log("[matrix/publish] Preview for", platform, ":", JSON.stringify({ title, content_length: content.length }));
    return NextResponse.json({ success: true, ...result });

  } catch (err) {
    console.error("[matrix/publish] Internal error:", err);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
