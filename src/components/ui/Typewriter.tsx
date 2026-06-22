"use client";

import { useState, useEffect, useRef } from "react";

export default function Typewriter({ text, className = "" }: { text: string; className?: string }) {
  const [display, setDisplay] = useState("");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let i = 0;
    let typing = true; // true = typing, false = deleting

    const tick = () => {
      if (!mountedRef.current) return;

      if (typing) {
        i++;
        setDisplay(text.slice(0, i));
        if (i >= text.length) {
          // Pause at full text, then start deleting
          setTimeout(() => { typing = false; tick(); }, 2000);
          return;
        }
      } else {
        i--;
        setDisplay(text.slice(0, i));
        if (i <= 0) {
          // Paused at empty, then start typing again
          setTimeout(() => { typing = true; tick(); }, 800);
          return;
        }
      }
      setTimeout(tick, typing ? 35 : 20);
    };

    tick();
    return () => { mountedRef.current = false; };
  }, [text]);

  return (
    <span className={className}>
      {display}
      <span className="animate-pulse" style={{ opacity: 0.7 }}>_</span>
    </span>
  );
}
