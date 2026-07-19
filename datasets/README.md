---
license: mit
task_categories:
- signal-processing
- verification
- time-series
language:
- en
tags:
- continuity
- presence-detection
- motion-signature
- cross-modal-binding
- gyroscope
- imu
- camera
pretty_name: MyShape Continuity Protocol — 576 Experimental Runs
size_categories:
- n<1K
---

# MyShape Continuity Protocol — Experimental Dataset

576 structured experimental runs across 4 evidence engines, validating cross-modal continuity verification on consumer hardware.

## Dataset Summary

This dataset contains the structured output of 576 verification sessions conducted on an iPhone with desktop camera (where applicable) between 2026-07-15 and 2026-07-19. Each run includes per-engine verdicts, component-level evidence scores, CFC (Continuity Failure Condition) check results, and round-level gyroscope telemetry.

## Engines

| Engine | N | Pass Rate | Description |
|--------|---|-----------|-------------|
| EE-003 | 200 | 59% | Gyroscope challenge-response (3 randomized rounds) |
| PE-001 single-device | 50 | 93% | Cross-modal coupling, camera + IMU on same phone |
| PE-001 independent | 266 | 58% | Cross-modal coupling, desktop camera + phone IMU |
| VS-001 | 60 | 93% | Dual-engine pipeline (EE-001 + EE-003) |

## Files

| File | Content |
|------|---------|
| `engine_summary.csv` | Per-engine aggregate statistics |
| `ee003_runs.csv` | Per-run EE-003 diagnostics with round-level telemetry |
| `pe001_runs.csv` | Per-run PE-001 diagnostics with tracker metadata |
| `vs001_runs.csv` | Per-run VS-001 diagnostics with passive scores |
| `tracker_comparison.csv` | Three-tracker comparison (pixel diff, color-blob, moving-blob) |

## Data Collection

All experiments were conducted on a single iPhone model with the following calibrated parameters (v0.3):

- JERK_MIN_THRESHOLD: 0.15 m/s³
- MAD multiplier: 2×
- MATCH_WINDOW_MS: ±500ms
- Refractory period: 150ms
- CAMERA_PIPELINE_LATENCY_MS: 80ms
- CFC-005 INVERSION_THRESHOLD_MS: 250ms

## Limitations

- Single-operator dataset (one entity, one device model)
- Camera motion tracking uses pixel-frame differencing or color-blob tracking, not MediaPipe (loading issues on test hardware)
- Lighting conditions varied (daylight vs. artificial light) and are not recorded per-run
- Raw sensor data (IMU samples, camera frames) was not persisted — only structured evidence output was retained

## Citation

```bibtex
@misc{continuity-lab-2026,
  author = {{The Continuity Lab}},
  title = {MyShape Continuity Protocol — Experimental Dataset},
  year = {2026},
  url = {https://huggingface.co/datasets/TheContinuityLab/myshape-576},
}
```

## License

MIT
