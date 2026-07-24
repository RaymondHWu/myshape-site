# CPS-0001 Protocol Demonstration v1.0

This release marks the first complete CPS-0001 protocol demonstration — a
full Producer → Receipt → Verifier → Consumer pipeline.

## Included

- **Continuity Receipt schema** — v1.0.0 frozen, compatibility policy documented
- **Receipt Builder** — `EngineEvidence[] → CPS-0001 ContinuityReceipt`
- **Reference Verifier** — V₁–V₇ step-by-step verification, engine-independent
- **HTTP Consumer** — Gateway returns ALLOW/DENY + risk score
- **External Onboarding Kit** — 30-minute self-guided walkthrough for independent implementers
- **Standalone examples** — Node.js minimal producer, Python V₁ verifier, reference receipt

## Protocol Artifacts

| Artifact | Status |
|----------|--------|
| Schema frozen (v1.0.0) | ✅ |
| Receipt Builder | ✅ |
| Reference Verifier (V₁–V₇) | ✅ |
| HTTP Consumer | ✅ |
| External onboarding | ✅ |
| Test suite | 537 passed, 5 skipped |

## The Open Question

The protocol object model is defined and demonstrated. The next step is
**independent implementation** — can a developer implement CPS-0001 without
reading MyShape engine code?

If you can generate or verify a valid Continuity Receipt using only the
schema, test vectors, and verifier — the protocol works.

→ `cps-0001-onboarding/START_HERE.md`
