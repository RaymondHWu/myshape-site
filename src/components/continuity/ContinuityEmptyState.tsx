"use client";

import Link from "next/link";
import { playTick } from "@/utils/useAudioTick";

export default function ContinuityEmptyState() {
  return (
    <div className="continuity-empty">
      <div className="continuity-empty-label">No Trajectories Yet</div>
      <p className="continuity-empty-text">
        The network is waiting for its first verified trajectories. Be the
        first to establish a sovereign continuity chain.
      </p>
      <Link
        href="/genesis"
        className="continuity-empty-cta"
        onMouseEnter={() => playTick(600, "sine", 0.08, 0.02)}
      >
        Initialize Your Trajectory →
      </Link>
    </div>
  );
}
