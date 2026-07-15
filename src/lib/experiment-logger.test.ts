import { describe, it, expect, beforeEach } from "vitest";
import {
  type ExperimentRun,
  saveRun,
  getRuns,
  getRunCount,
  getRunsByEngine,
  clearRuns,
  exportJSON,
} from "./experiment-logger";

// localStorage mock for Node test environment
const store = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => { store.set(key, value); },
  removeItem: (key: string) => { store.delete(key); },
  clear: () => { store.clear(); },
};
Object.defineProperty(globalThis, "localStorage", { value: mockLocalStorage, writable: true });
Object.defineProperty(globalThis, "window", { value: globalThis, writable: true });

function makeRun(overrides: Partial<ExperimentRun> = {}): ExperimentRun {
  return {
    id: "test-1",
    engineId: "EE-003",
    timestamp: new Date().toISOString(),
    isSimulated: false,
    verdict: "PASS",
    confidence: 0.85,
    components: [{ metric: "DirectionMatch", value: 0.9, threshold: 0.5, status: "PASS" }],
    diagnostics: ["✓ All rounds passed"],
    ...overrides,
  };
}

describe("experiment-logger", () => {
  beforeEach(() => {
    store.clear();
  });

  describe("saveRun", () => {
    it("saves a run to localStorage", () => {
      const run = makeRun();
      saveRun(run);
      expect(getRunCount()).toBe(1);
    });

    it("appends multiple runs", () => {
      saveRun(makeRun({ id: "a" }));
      saveRun(makeRun({ id: "b" }));
      saveRun(makeRun({ id: "c" }));
      expect(getRunCount()).toBe(3);
    });

    it("preserves all fields round-trip", () => {
      const run = makeRun({
        roundResults: [{ round: 1, direction: "→", directionMatch: true, magnitudeStatus: "PASS", angleDeg: 45, peakG: 1.2, sampleCount: 100 }],
        passiveScore: 0.55,
        decision: "escalate",
        imuCount: 500,
        camCount: 120,
      });
      saveRun(run);
      const [saved] = getRuns();
      expect(saved.verdict).toBe("PASS");
      expect(saved.confidence).toBe(0.85);
      expect(saved.roundResults).toHaveLength(1);
      expect(saved.roundResults![0].direction).toBe("→");
      expect(saved.passiveScore).toBe(0.55);
      expect(saved.decision).toBe("escalate");
      expect(saved.imuCount).toBe(500);
      expect(saved.camCount).toBe(120);
    });

    it("caps at 500 runs (keeps most recent)", () => {
      for (let i = 0; i < 600; i++) {
        saveRun(makeRun({ id: `run-${i}` }));
      }
      expect(getRunCount()).toBe(500);
      const runs = getRuns();
      // First run should be the 101st (index 100), not the 1st
      expect(runs[0].id).toBe("run-100");
      // Last run should be the 600th
      expect(runs[499].id).toBe("run-599");
    });
  });

  describe("getRuns", () => {
    it("returns empty array when no runs", () => {
      expect(getRuns()).toEqual([]);
    });

    it("returns all runs", () => {
      saveRun(makeRun({ id: "a" }));
      saveRun(makeRun({ id: "b" }));
      expect(getRuns()).toHaveLength(2);
    });
  });

  describe("getRunCount", () => {
    it("returns 0 for empty storage", () => {
      expect(getRunCount()).toBe(0);
    });

    it("returns correct count", () => {
      saveRun(makeRun());
      saveRun(makeRun());
      expect(getRunCount()).toBe(2);
    });
  });

  describe("getRunsByEngine", () => {
    it("filters by engineId", () => {
      saveRun(makeRun({ id: "a", engineId: "EE-001" }));
      saveRun(makeRun({ id: "b", engineId: "EE-003" }));
      saveRun(makeRun({ id: "c", engineId: "EE-003" }));
      expect(getRunsByEngine("EE-003")).toHaveLength(2);
      expect(getRunsByEngine("EE-001")).toHaveLength(1);
      expect(getRunsByEngine("EE-002")).toHaveLength(0);
    });
  });

  describe("clearRuns", () => {
    it("removes all runs", () => {
      saveRun(makeRun());
      saveRun(makeRun());
      clearRuns();
      expect(getRunCount()).toBe(0);
    });
  });

  describe("exportJSON", () => {
    it("exports valid JSON", () => {
      saveRun(makeRun({ id: "a" }));
      saveRun(makeRun({ id: "b" }));
      const json = exportJSON();
      const parsed = JSON.parse(json);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe("a");
    });
  });

  describe("corrupt localStorage handling", () => {
    it("getRuns returns empty on corrupt JSON", () => {
      localStorage.setItem("myshape-experiment-runs", "{not valid json");
      expect(getRuns()).toEqual([]);
    });

    it("getRunCount returns 0 on corrupt JSON", () => {
      localStorage.setItem("myshape-experiment-runs", "garbage");
      expect(getRunCount()).toBe(0);
    });
  });
});
