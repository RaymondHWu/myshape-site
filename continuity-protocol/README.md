# CPS-0001

CPS-0001 defines a portable continuity receipt format and verification contract.

**License**: Apache 2.0

---

## Quick Start

```bash
cd cli && npm install
node bin/cps-verify.mjs ../test-vectors/valid/single-engine.json
# → VERDICT: ✅ VALID
```

## Build Your Own Producer

→ **[START_HERE.md](START_HERE.md)** — 30–90 minute guided walkthrough.

New to CPS-0001? Start there. It covers the protocol object model, the engine interface, and the verification pipeline. No MyShape knowledge required.

## Structure

```
├── START_HERE.md                          ← Entry point for new implementers
├── CPS0001.md                             ← Protocol specification
├── ENGINE_AUTHORING_GUIDE.md              ← How to build an Engine
├── WHY_CPS_DOES_NOT_VALIDATE_EVIDENCE.md  ← Protocol boundary
├── onboarding-test.mjs                    ← Full pipeline template
├── cli/                                   ← Standalone verifier
│   └── bin/cps-verify.mjs
├── reference-verifier/                    ← Reference implementation (Web Crypto)
├── second-producer/                       ← Reference implementations (@noble)
│   ├── toy-engine.ts                      ← Minimal example (30 lines)
│   ├── agent-trace-engine.ts              ← System execution trace example
│   └── noble-verifier.ts
├── test-vectors/
│   ├── valid/                             ← Known-good receipts
│   └── invalid/                           ← Tampered, expired, broken
├── schemas/                               ← JSON Schema
└── conformance/                           ← Conformance test suite
```

## Independent Implementation Challenge

→ **[BLIND_IMPLEMENTATION_CHALLENGE.md](BLIND_IMPLEMENTATION_CHALLENGE.md)** — Can you implement CPS-0001 without access to the original implementation?

We are testing whether this specification is sufficient for independent implementation. If you'd like to participate, read the challenge and submit your results.

Currently tracking results in → **[BLIND_TEST_REPORT.md](BLIND_TEST_REPORT.md)**

---

*Part of the Continuity Protocol Project · 2026-07-24*
