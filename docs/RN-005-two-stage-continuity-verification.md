# RN-005 — Two-Stage Continuity Verification

**CPS-0001 v0.2 · Experimental Note**

Status: Draft v0.1 — published 2026-08-16.

Implementation baseline: `3a2680c`

## Research Question

*Primary experimental question.* Can a strong presence signal compensate for an incomplete continuity challenge?

*Broader research question.* Can temporal continuity provide a verification property that static identity alone cannot?

This note reports a small real-device experiment that addresses only the first. The second is Continuity Lab's larger research question; these four trials do not settle it.

## Why This Experiment

CPS-0001's earlier verification combined evidence engines into a single weighted score. Under that scheme, a strong presence reading (EE-001) could numerically offset a weak continuity-challenge reading (EE-003), so a partially-completed challenge could still yield a VERIFIED verdict. This experiment tests a two-stage alternative in which both stages are mandatory.

## Method

Two-stage decision rule (v0.2):

```text
stage1Pass = (EE-001 ≥ 0.50)      // presence threshold
stage2Pass = (EE-003 = 1.000)     // challenge-pass confidence
verified   = stage1Pass AND stage2Pass
confidence = min(EE-001, EE-003)  // weakest link
```

EE-003 is a mandatory three-round gyroscope challenge-response gate. A round passes only if the measured rotation has the prompted direction **and** its magnitude meets a minimum threshold (≥ 40°/s):

```text
EE-003 = 1.000  if all 3 rounds pass
         0.000  otherwise
```

So 2/3 is **not** 0.667 — it is a failed challenge (EE-003 = 0.000).

## Experimental Setup

Four trials (A–D) on a single physical device, single session, single participant.

- **A** — correct rotations, all three rounds
- **B** — no rotation, all three rounds
- **C** — correct rotations, all three rounds (repeat)
- **D** — two correct rounds; round 3 deliberately failed

## Results

| Trial | Challenge | EE-003 | Stage 2 | Verdict |
|:---|:---|:---|:---|:---|
| A | 3/3 correct | 1.000 | PASS | VERIFIED |
| B | 0/3 (no rotation) | 0.000 | FAIL | NOT VERIFIED |
| C | 3/3 correct | 1.000 | PASS | VERIFIED |
| D | 2/3 (round 3 failed) | 0.000 | FAIL | NOT VERIFIED |

*Test D — per-round detail (the decisive case):*

| Round | Measured peak rotation (± direction) | Pass |
|:---|:---|:---|
| R1 | +269°/s | PASS |
| R2 | −117°/s | PASS |
| R3 | +3°/s | FAIL |

In Test D, EE-001 = **0.800** → Stage 1 PASS, while EE-003 = **0.000** → Stage 2 FAIL. The final verdict was **NOT VERIFIED**, with confidence = min(0.800, 0.000) = **0.000**.

## Key Observation

> Presence alone must not compensate for an incomplete continuity challenge.

## Interpretation

Test D shows that a strong presence reading (EE-001 = 0.800, above the Stage-1 threshold) did **not** rescue a 2/3 challenge. Under the previous weighted aggregation, the same EE-001 = 0.800 and partial EE-003 evidence would have contributed to the aggregate score rather than acting as a mandatory gate. The v0.2 decision rule removes that compensation path. The rule separates presence evidence passing Stage 1 from challenge completion passing Stage 2, and neither substitutes for the other.

## Limitations

- n = 4 trials; single device, single session, single participant.
- The experiment was not designed to estimate population-level performance.
- Results are from a verified v0.2 runtime. One earlier run against a stale (pre-v0.2) build produced an inconsistent result and was discarded; it is not reported above.
- Per-round sensor detail was transcribed for Test D only; A/B/C are recorded at the summary level as received.

## Non-Claims

- This is **not** a security proof.
- This is **not** a false-acceptance-rate (FAR) or false-rejection-rate (FRR) benchmark.
- This does **not** demonstrate spoof resistance.
- This does **not** establish generalization across devices, users, environments, or motion patterns.
- This does **not** claim presence and continuity are sufficient, or the only, verification properties.

## What Would Challenge This Observation?

The observation would be weakened if independent testing showed that incomplete continuity challenges can reliably produce VERIFIED outcomes under the v0.2 decision rule, or if the two-stage rule fails to distinguish intentionally incomplete challenges from valid challenge completion across broader testing conditions.

## Implementation Baseline

- Commit `3a2680c` — *feat: implement CPS-0001 v0.2 two-stage verification*
- Test suite: **606 passing** (5 skipped) across 42 files.

## Reproducibility / External Validation

The two-stage rule and EE-003 gate are fully specified above; the implementation is the referenced commit. We invite independent reproduction and adversarial testing. If you can produce a false VERIFIED receipt — or otherwise break the assumption that presence must not compensate for an incomplete challenge — open an issue.

## Conclusion

In these four trials, the two-stage decision rule produced the intended separation: presence evidence did not compensate for an incomplete continuity challenge. This is one small, falsifiable data point toward the question of whether temporal continuity provides a verification property that static identity alone cannot.
