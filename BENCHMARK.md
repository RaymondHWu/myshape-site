# BM-001 — Presence Entropy Score Benchmark

**One command. Two minutes. Reproduce our results.**

The Continuity Lab publishes benchmarks that anyone can run, verify, and challenge. This is the quickstart.

## Run the Benchmark

```bash
git clone https://github.com/myshapeprotocol/myshape-protocol.git
cd myshape-protocol
npm install
npm run benchmark
```

That's it. You should see:

```
✓ PES Benchmark v0.1 — generates and evaluates human motion samples
✓ PES Benchmark v0.1 — generates and evaluates AI motion samples
✓ PES Benchmark v0.1 — generates and evaluates replay attack samples
✓ PES Benchmark v0.1 — produces clean confusion matrix (Human vs AI)
✓ PES Benchmark v0.1 — each dimension independently separates human from AI
✓ PES Score Bounds — all PES scores are in [0, 1]

Test Files  2 passed (2)
Tests       11 passed (11)
```

## What This Measures

The Presence Entropy Score (PES) quantifies biological entropy in motion across four independent dimensions:

| Dimension | What it measures | Human mean | AI mean |
|:---|:---|:---|:---|
| Micro-timing variance | Frame-to-frame jitter | 0.72 | 0.18 |
| Noise residual | Deviation from smoothed trajectory | 0.68 | 0.22 |
| Frequency entropy | Spectral spread across bands | 0.74 | 0.25 |
| Biological perturbation | Micro-tremor oscillation | 0.61 | 0.12 |

**Aggregate:** Cohen's d = 2.1 · AUC = 0.94 · Human threshold: 0.40

## Challenge It

Think PES fails under a specific condition? [Open an issue](https://github.com/myshapeprotocol/myshape-protocol/issues/new) or visit our [Challenge page](https://www.myshape.com/research/challenge). Describe the scenario where you believe PES would misclassify. We will test it and publish the result — whether it confirms or refutes the current benchmark.

**Negative results are results.**

## More

- [Research Hub](https://www.myshape.com/research)
- [RN-002 — Full benchmark report](https://www.myshape.com/research/notes/002-pes-benchmark)
- [DS-001 — Dataset](https://www.myshape.com/research/dataset)
- [The Continuity Lab](https://www.myshape.com/research)

---

*Every benchmark is temporary. Every question is permanent.*
