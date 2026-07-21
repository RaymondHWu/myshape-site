# Why We Published CPS-0001 Before We Had Adoption

The Continuity Lab · Research Note · 2026-07-22

---

## The standard playbook says: don't publish until someone needs it.

Most protocol projects follow a familiar path:

1. Find a market need.
2. Build a solution.
3. Publish the spec.
4. Drive adoption.

We did it differently. We published the spec before we had evidence of adoption. And we did it deliberately.

## What we built

CPS-0001 is a protocol object for continuity assertions. A Continuity Receipt is a cryptographically verifiable statement that an observer collected sufficient evidence supporting the continuity of a subject over a bounded interval of time.

It is engine-independent. It does not reference IMU, camera, MediaPipe, or any specific sensor. A third party can build a completely different evidence engine — using different sensors, different algorithms, different hardware — and produce a valid receipt that any conforming verifier can process.

The closed loop works:

```
Producer → Continuity Receipt → Verifier (V₁–V₇) → Consumer Decision
```

We built a reference verifier, a conformance suite, a second independent producer (proving engine independence), JSON Schema, test vectors, and an HTTP verifier plugin that reads receipts and returns allow/deny decisions. All open source. Apache 2.0.

## What we don't have

**We don't have evidence that anyone needs this.**

We don't know whether AI agent runtimes, enterprise security teams, XR platforms, or robotics engineers actually encounter a problem that CPS-0001 solves. We have hypotheses — three of them, formalized as EXP-001, EXP-002, and EXP-003 — but no data yet.

We are running discovery interviews to find out. If most teams say "session cookies and token rotation are sufficient," the hypothesis is falsified. We will publish that result regardless of what it says.

## Why publish before adoption?

Three reasons.

### 1. Protocol objects benefit from early visibility

JWT was published before it was widely adopted. OAuth 1.0 was published and then rewritten. gRPC, Protocol Buffers, and HTTP/2 all had public drafts long before broad deployment. The early visibility allowed implementers to find problems, suggest changes, and build compatible tools before the spec was frozen.

If CPS-0001 defines a genuinely useful protocol object, early publication gives the community time to examine it, criticize it, and — if they see value — build against it.

### 2. We want to find out if the problem is real — not pretend it is

Most projects start with a problem and build a solution. We started with a technical capability and are now investigating whether a problem exists that requires it.

This is research, not product development. The honest research posture is:

> "We built something. We don't know if it's useful. Here it is. Help us find out."

This is not a marketing position. It's a scientific one.

### 3. If there's no demand, we want to know that too

A falsified hypothesis is a valid research outcome. If 20 interviews across robotics, XR, security, and agent frameworks reveal that no one needs a standardized continuity object — we will publish that conclusion.

That's a better outcome than spending two years pretending there's demand when there isn't.

## What happens next

We are running structured discovery interviews. The survey is at `thecontinuitylab.org/lab/discovery-survey`. Three experiments — EXP-001 (AI Agent Authorization), EXP-002 (Enterprise Session Continuity), EXP-003 (XR Spatial Session) — each with a falsifiable hypothesis, evidence requirements, and a public evidence log.

If we find three or more unrelated teams independently solving the same continuity problem with different proprietary formats, the protocol has a reason to exist. If we don't, the protocol will be archived as a research artifact — a well-specified solution to a problem that, at this moment in time, does not exist.

Either outcome is worth publishing.

---

*The Continuity Lab is a research organization. We are not a company. We have no product, no funding, and no customers. CPS-0001 is published under Apache 2.0. MyShape is the first protocol implementation, maintained separately.*
