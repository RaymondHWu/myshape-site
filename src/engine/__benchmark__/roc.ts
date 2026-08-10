// ============================================================
// MyShape Protocol — ROC / AUC Statistics
//
// Reusable, dependency-free statistical primitives for evaluating
// how well a score distinguishes two classes (e.g. human vs AI):
//
//   computeAUC            → Mann-Whitney U (Hand & Till, 2001)
//   youdenThreshold       → optimal threshold via Youden's J
//   bootstrapAUCCI         → 95% CI on AUC via bias-corrected percentile bootstrap
//
// Convention: higher score = positive (human). Ties are handled by
// average-rank assignment.
// ============================================================

export interface ROCThresholdResult {
  threshold: number;
  sensitivity: number; // TPR
  specificity: number; // TNR
  youdenJ: number;     // sensitivity + specificity - 1
}

export interface BCAUCIResult {
  mean: number;
  ciLow: number;     // 2.5th percentile
  ciHigh: number;    // 97.5th percentile
  stdError: number;
  rounds: number;
}

/**
 * Area Under the ROC Curve via the Mann-Whitney U statistic.
 * AUC = (Σ ranks of positives − nPos(nPos+1)/2) / (nPos · nNeg)
 */
export function computeAUC(positive: number[], negative: number[]): number {
  const nPos = positive.length;
  const nNeg = negative.length;
  if (nPos === 0 || nNeg === 0) return 0.5;

  const entries: Array<{ value: number; isPos: boolean }> = [];
  for (const v of positive) entries.push({ value: v, isPos: true });
  for (const v of negative) entries.push({ value: v, isPos: false });
  entries.sort((a, b) => a.value - b.value);

  // Average-rank assignment for ties
  const avgRanks: number[] = new Array(entries.length);
  let i = 0;
  while (i < entries.length) {
    let j = i;
    while (j + 1 < entries.length && entries[j + 1].value === entries[i].value) j++;
    const avg = (i + 1 + j + 1) / 2;
    for (let k = i; k <= j; k++) avgRanks[k] = avg;
    i = j + 1;
  }

  let sumPosRanks = 0;
  for (let k = 0; k < entries.length; k++) {
    if (entries[k].isPos) sumPosRanks += avgRanks[k];
  }

  const auc = (sumPosRanks - (nPos * (nPos + 1)) / 2) / (nPos * nNeg);
  return Math.max(0, Math.min(1, auc));
}

/**
 * Find the threshold that maximizes Youden's J (= sensitivity + specificity − 1),
 * i.e. the cut point that balances true-positive and true-negative rates.
 * Prediction: score >= threshold → predicted human.
 */
export function youdenThreshold(positive: number[], negative: number[]): ROCThresholdResult {
  const candidates = [...new Set([...positive, ...negative])].sort((a, b) => a - b);
  if (candidates.length === 0) {
    return { threshold: 0, sensitivity: 0, specificity: 0, youdenJ: -Infinity };
  }

  let best: ROCThresholdResult = {
    threshold: candidates[0],
    sensitivity: 0,
    specificity: 0,
    youdenJ: -Infinity,
  };

  for (const t of candidates) {
    let tp = 0;
    let fn = 0;
    for (const v of positive) if (v >= t) tp++; else fn++;
    let fp = 0;
    let tn = 0;
    for (const v of negative) if (v >= t) fp++; else tn++;

    const sens = positive.length ? tp / positive.length : 0;
    const spec = negative.length ? tn / negative.length : 0;
    const j = sens + spec - 1;

    if (j > best.youdenJ) {
      best = { threshold: t, sensitivity: sens, specificity: spec, youdenJ: j };
    }
  }

  return best;
}

/** Deterministic 32-bit PRNG (mulberry32) — reproducible resampling. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Bootstrap 95% confidence interval for AUC via percentile method.
 * Resamples each class with replacement (2000 rounds default) using a
 * seeded PRNG for reproducibility.
 */
export function bootstrapAUCCI(
  positive: number[],
  negative: number[],
  rounds = 2000,
  seed = 12345,
): BCAUCIResult {
  const rng = mulberry32(seed);
  const aucs: number[] = new Array(rounds);

  for (let r = 0; r < rounds; r++) {
    const pos = new Array<number>(positive.length);
    const neg = new Array<number>(negative.length);
    for (let k = 0; k < positive.length; k++) pos[k] = positive[Math.floor(rng() * positive.length)];
    for (let k = 0; k < negative.length; k++) neg[k] = negative[Math.floor(rng() * negative.length)];
    aucs[r] = computeAUC(pos, neg);
  }

  aucs.sort((a, b) => a - b);
  const mean = aucs.reduce((s, v) => s + v, 0) / rounds;
  const std = Math.sqrt(aucs.reduce((s, v) => s + (v - mean) ** 2, 0) / rounds);
  const iLow = Math.max(0, Math.floor(rounds * 0.025));
  const iHigh = Math.min(rounds - 1, Math.floor(rounds * 0.975));

  return { mean, ciLow: aucs[iLow], ciHigh: aucs[iHigh], stdError: std, rounds };
}
