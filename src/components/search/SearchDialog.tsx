"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Result {
  title: string;
  subtitle?: string;
  url: string;
  type: "blog" | "glossary" | "page";
  score: number;
}

export default function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  // Cmd+K / Ctrl+K to toggle
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    },
    []
  );

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onKeyDown]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
      setLoading(false);
    }, 150);
    return () => clearTimeout(t);
  }, [query]);

  if (!open) return null;

  const typeLabel: Record<string, string> = {
    blog: "Blog",
    glossary: "Glossary",
    page: "Page",
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Dialog */}
      <div className="relative w-full max-w-lg mx-4 bg-[#0a0f18] border border-[#90c8ff]/15 shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.05]">
          <span className="text-[#90c8ff]/30 text-sm">›</span>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search blog, glossary, pages..."
            className="flex-1 bg-transparent text-white/80 text-[14px] tracking-[0.03em] outline-none placeholder:text-white/15 font-mono"
          />
          <span className="text-white/10 text-[11px] tracking-[0.1em] font-mono">ESC</span>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="px-4 py-8 text-center text-white/15 text-[11px] tracking-[0.1em] font-mono">
              Searching...
            </div>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="px-4 py-8 text-center text-white/15 text-[11px] tracking-[0.1em] font-mono">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}
          {results.map((r, i) => (
            <Link
              key={i}
              href={r.url}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 hover:bg-white/[0.02] border-b border-white/[0.02] transition-colors group"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[11px] tracking-[0.15em] uppercase font-mono ${
                  r.type === "blog" ? "text-[#90c8ff]/40" : r.type === "glossary" ? "text-[#d4af37]/40" : "text-white/25"
                }`}>
                  {typeLabel[r.type]}
                </span>
              </div>
              <div className="text-white/70 text-[13px] tracking-[0.03em] group-hover:text-white/90 transition-colors font-mono">
                {r.title}
              </div>
              {r.subtitle && (
                <div className="text-white/25 text-[11px] tracking-[0.03em] leading-snug mt-0.5 truncate">
                  {r.subtitle}
                </div>
              )}
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/[0.04] flex items-center justify-between text-white/10 text-[11px] tracking-[0.15em] font-mono">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
        </div>
      </div>
    </div>
  );
}
