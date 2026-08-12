"use client";

import { useEffect } from "react";
import { resumeAudio } from "@/utils/useAudioTick";

/**
 * Forces the AudioContext to initialize on first user interaction.
 * Mounted once in layout.tsx so the module-side-effect listeners
 * are guaranteed to be registered before any component calls playTick.
 */
export default function AudioInit() {
  useEffect(() => {
    // Resume on mount — covers the case where the page was loaded
    // via client-side navigation (no full reload).
    resumeAudio();
  }, []);

  return null;
}