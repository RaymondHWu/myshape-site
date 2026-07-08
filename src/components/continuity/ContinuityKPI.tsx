"use client";

import { playTick } from "@/utils/useAudioTick";
import type { NetworkData } from "./types";

interface Props {
  data: NetworkData;
  evoEntropy: number;
}

const KPI_LABELS: Record<string, { label: string; extra: string }> = {
  Trajectories: { label: "Trajectories", extra: "" },
  "Evolutionary Entropy": {
    label: "Evolutionary Entropy",
    extra: "protocol vitality index",
  },
  "Presence Receipts": {
    label: "Presence Receipts",
    extra: "total notarized becomings",
  },
  "Active Today": {
    label: "Active Today",
    extra: "continuity signals / 24h",
  },
};

export default function ContinuityKPI({ data, evoEntropy }: Props) {
  const kpis = [
    {
      key: "Trajectories",
      value: data.totalNodes,
      extra: `${data.activeHumans} human · ${data.agents} agent`,
    },
    {
      key: "Evolutionary Entropy",
      value: evoEntropy,
      extra: "protocol vitality index",
    },
    {
      key: "Presence Receipts",
      value: data.totalScans,
      extra: "total notarized becomings",
    },
    {
      key: "Active Today",
      value: data.activeToday,
      extra: "continuity signals / 24h",
    },
  ];

  return (
    <div className="continuity-kpi-grid">
      {kpis.map((kpi) => (
        <div
          key={kpi.key}
          className="continuity-kpi-card"
          onMouseEnter={() => playTick(500, "sine", 0.04, 0.01)}
        >
          <div className="continuity-kpi-label">{kpi.key}</div>
          <div className="continuity-kpi-value">
            {typeof kpi.value === "number"
              ? kpi.value.toLocaleString()
              : kpi.value}
          </div>
          <div className="continuity-kpi-extra">{kpi.extra}</div>
        </div>
      ))}
    </div>
  );
}
