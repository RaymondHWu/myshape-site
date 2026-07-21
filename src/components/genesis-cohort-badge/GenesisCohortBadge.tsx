"use client";

import { useState } from "react";

export default function GenesisCohortBadge() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleNotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || sent) return;
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
    } catch {}
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3 px-4 py-2 border border-[#90c8ff]/20 bg-[#90c8ff]/[0.04]">
        <div className="w-1.5 h-1.5 rounded-full bg-[#90c8ff] animate-pulse shadow-[0_0_6px_#90c8ff]" />
        <span className="text-[#90c8ff]/70 text-[11px] tracking-[0.15em] font-mono uppercase">
          Phase: Genesis Alpha
        </span>
        <span className="text-white/10">·</span>
        <span className="text-[#90c8ff]/40 text-[11px] tracking-[0.12em] font-mono uppercase">
          Access Restricted
        </span>
      </div>

      {/* Beta notification — subtle email capture */}
      <form onSubmit={handleNotify} className="flex items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={sent ? "Notified ✓" : "Get notified when beta opens"}
          disabled={sent}
          className="bg-transparent border-b border-white/[0.08] py-1.5 px-1 text-white/30 text-[11px] tracking-[0.08em] font-mono outline-none focus:border-[#90c8ff]/40 placeholder:text-white/12 disabled:opacity-40 w-48 text-center"
        />
        {!sent && (
          <button
            type="submit"
            className="text-[#90c8ff]/25 hover:text-[#90c8ff]/55 text-[11px] tracking-[0.2em] uppercase font-mono transition-colors"
          >
            →
          </button>
        )}
      </form>
    </div>
  );
}
