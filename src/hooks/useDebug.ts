"use client";

import { useState, useEffect } from "react";

/**
 * Read ?debug=1 from URL query string.
 * When true, show raw diagnostics. When false (default), show research-facing output.
 */
export function useDebug(): boolean {
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    setDebug(p.get("debug") === "1");
  }, []);

  return debug;
}
