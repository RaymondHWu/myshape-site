# Why CPS-0001 Does Not Validate Evidence

**The most important design decision in this protocol is also the least obvious.**

---

## The Question Every Reviewer Asks

> "Why doesn't the Verifier check whether the evidence is real?"

The short answer: **because that's not the Verifier's job.**

The long answer follows.

---

## The Responsibility Boundary

```
                    ┌─────────────────┐
                    │     Engine       │
                    │                  │
                    │  Decides:        │
                    │  "What is true?" │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    Evidence      │
                    │                  │
                    │  Opaque payload  │
                    │  + digest        │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │     Receipt      │
                    │                  │
                    │  Protocol object │
                    │  + signature     │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │    Verifier      │
                    │                  │
                    │  Validates:      │
                    │  "Is the receipt │
                    │   well-formed?"  │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Application    │
                    │                  │
                    │  Decides:        │
                    │  "Do I trust     │
                    │   this enough?"  │
                    └─────────────────┘
```

| Layer | Responsibility | Example |
|:---|:---|:---|
| **Engine** | What is true? | "The PES score is 0.74" |
| **Receipt** | What was observed? | `{ engineId: "EE-001", confidence: 0.74 }` |
| **Verifier** | Is the receipt well-formed? | V₁–V₆ checks |
| **Application** | Do I trust this? | "Accept if PES ≥ 0.70" |

**The Verifier validates protocol conformance, not evidence quality.**

---

## What the Verifier Does NOT Check

The Verifier never inspects `evidence.payload`.

It does not know:

- Whether the sensor was real
- Whether the PES score was computed correctly
- Whether the Engine is trustworthy
- Whether 0.74 is "good enough" for any purpose

It knows only:

- The receipt has all required fields (V₁)
- The signature is valid (V₂)
- The assertions are internally consistent (V₃)
- The timeline is coherent (V₄)
- The evidence digests match (V₅)
- The receipt hasn't expired (V₆)

That's it. Six checks. None of them look at what's inside the payload.

---

## Why This Is Correct

### Reason 1: Engines Evolve, Protocols Shouldn't

If the Verifier knew about PES thresholds, it would need to be updated every time the PES algorithm changes. If the Verifier knew about heart rate variability, GPS coordinates, or pressure sensors, it would need domain-specific knowledge about dozens of evidence types.

**A Verifier that inspects payloads cannot be universal.** A Verifier that doesn't, can.

### Reason 2: The Application Decides Trust

The same receipt may be:

| Application | Threshold | Decision |
|:---|:---|:---|
| Exam proctoring | PES ≥ 0.70 | Trust |
| Blog comment | PES ≥ 0.20 | Trust |
| Financial transaction | PES ≥ 0.85 + HRV ≥ 0.60 | Trust |

The Verifier cannot make these decisions because it doesn't know the application's risk tolerance. **Trust is contextual.** The protocol provides the facts; the application makes the judgment.

### Reason 3: Separation Enables Competition

If the Verifier hard-coded which Engines are "trusted," new Engines could never enter the ecosystem without protocol changes. **The neutrality of the Verifier is what makes Engine competition possible.**

### Reason 4: The Toy Engine Proof

```
Toy Engine (EE-999)
  input:  ""           (empty string)
  output: confidence = 0

↓ Receipt: VALID
```

This is not a bug. The Toy Engine proves that the Verifier does not inspect payloads. A Receipt containing meaningless evidence is still a valid Receipt — because "valid" means "structurally conformant," not "factually true."

**The interpretation of that evidence belongs to the issuing Engine and the consuming Application — not to CPS-0001.**

---

## The Boundary Matrix

| Test Case | Evidence Quality | Receipt Validity |
|:---|:---|:---|
| PES Engine (real sensor) | ✅ Meaningful | ✅ VALID |
| Toy Engine (no sensor) | ❌ Meaningless | ✅ VALID |
| Toy Engine (empty input, confidence=0) | ❌ Meaningless | ✅ VALID |
| Wrong Version | N/A | ❌ INVALID |
| Missing Field | N/A | ❌ INVALID |
| Wrong Digest | N/A | ❌ INVALID |
| Wrong Signature | N/A | ❌ INVALID |
| Expired | N/A | ❌ INVALID |
| Invalid Interval | N/A | ❌ INVALID |
| Inconsistent Assertions | N/A | ❌ INVALID |

**Every test in the FAIL column is about protocol structure, not evidence content.** That's the boundary.

---

## Frequently Anticipated Objections

**Q: "So anyone can submit garbage evidence and get a VALID receipt?"**

A: Yes. And that receipt will have confidence = 0. The Verifier doesn't decide whether to trust it. The Application does. An Application that accepts confidence = 0 is making a bad decision — but that's the Application's fault, not the protocol's.

**Q: "Doesn't this make the protocol useless?"**

A: No. It makes the protocol universal. If the Verifier only accepted "real" evidence, it would only work for one definition of "real." By not defining "real," the protocol works for all definitions.

**Q: "What stops someone from writing a lying Engine?"**

A: Nothing. The same way nothing stops someone from writing a lying HTTP server. Trust in the Engine is established socially, reputationally, or cryptographically — outside the protocol. The protocol provides the container; the ecosystem provides the trust.

---

*Part of the Continuity Protocol Project · 2026-07-24*
