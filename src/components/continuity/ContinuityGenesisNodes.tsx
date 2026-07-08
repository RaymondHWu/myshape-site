"use client";

import { playTick } from "@/utils/useAudioTick";
import type { NetworkData } from "./types";

interface Props {
  data: NetworkData;
}

export default function ContinuityGenesisNodes({ data }: Props) {
  if (data.genesisNodes === 0) return null;

  return (
    <section
      className="continuity-genesis"
      aria-labelledby="genesis-nodes-heading"
      onMouseEnter={() => playTick(400, "sine", 0.03, 0.008)}
    >
      <div className="continuity-genesis-header">
        <span id="genesis-nodes-heading" className="continuity-genesis-label">
          Founding Cohort
        </span>
        <span className="continuity-genesis-count">
          {data.genesisNodes} / 100
        </span>
      </div>
      <div className="continuity-genesis-tags">
        {data.nodes
          .filter((n) => n.isGenesis)
          .slice(0, 20)
          .map((n, i) => (
            <div
              key={n.handle || i}
              className="continuity-genesis-tag"
              onMouseEnter={() => playTick(350, "sine", 0.03, 0.006)}
            >
              {n.handle || `GNS_${i + 1}`}
            </div>
          ))}
        {data.genesisNodes > 20 && (
          <div className="continuity-genesis-more">
            +{data.genesisNodes - 20} more
          </div>
        )}
      </div>
    </section>
  );
}
