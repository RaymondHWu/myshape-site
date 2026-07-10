# We Are Investigating a Question, Not Launching a Startup

**Introducing The Continuity Lab.**

---

Identity answers who you are. Continuity answers whether you remained you.

For fifty years, digital identity has been a solved problem — at least in principle. Passports, DIDs, Verifiable Credentials, ZK-proofs. Each confirms that entity E possesses attribute A at moment t₀. Identity is a snapshot.

But snapshots cannot answer a different question: has this entity **continued to exist** across the interval?

When an AI agent returns from a two-week autonomous deployment, how do we know it is still the same agent — not a replacement using the same credentials? When a session is hijacked between FaceID check-in and afternoon operation, identity succeeds. Continuity fails.

This question has no answer in today's cryptographic stack. There is no primitive for continuity.

---

## The Continuity Lab

We are a research program investigating whether **continuity can become a verifiable property of digital existence.**

We are not a startup. We are not launching a token. We are asking a question — and designing experiments that could falsify our own hypotheses.

The lab is the research arm of [MyShape Protocol](https://www.myshape.com), a sovereign continuity layer built on motion-signature verification. But the lab's scope is broader than the protocol. We study the problem. The protocol is one proposed answer.

---

## What We've Published

Two research notes, one benchmark suite, one open question. All public. All citable.

**[`RN-001` — The Continuity Problem](https://www.myshape.com/research/notes/001-the-continuity-problem)** — Why proving "I am still me" may become the missing cryptographic primitive of the AI era. Four attack scenarios where identity succeeds and continuity fails.

**[`RN-002` — PES Benchmark v0.2](https://www.myshape.com/research/notes/002-pes-benchmark)** — 281 motion samples (81 human, 200 synthetic). Cohen's d: 2.1. AUC: 0.94. Five threats to validity documented. The signal is real; the limitations are published alongside the results.

**[`BM-001` — Protocol Benchmarks](https://www.myshape.com/research/benchmarks)** — 309 tests across 100 suites. Seven protocol engines. Zero failures.

**[`OQ-001` — Can continuity exist independently of identity?](https://www.myshape.com/research/open-questions/001)** — If continuity can be verified without persistent identifiers, humans, AI agents, and hybrid entities may share a common verification substrate. The lab's central open question.

---

## How We Work

We operate on five principles:

1. **We test hypotheses. We do not defend them.**
2. **We publish limitations before we publish claims.**
3. **We measure before we assert.**
4. **Evidence precedes belief.**
5. **Continuity is not only what we study. It is how we work.**

Every research object has a permanent artifact ID (`RN-001`, `BM-001`, `DL-001`). Every decision is logged with its reasoning. Every benchmark is timestamped with its last run. The goal is institutional memory — so that five years from now, a new collaborator can trace why we made the choices we made.

---

## Open for Peer Review

We do not ask for capital. We ask for verification.

Check our [benchmark data](https://www.myshape.com/research/benchmarks), run our [challenge set](https://github.com/myshapeprotocol), and tell us where we are wrong.

If you are a researcher, graduate student, or engineer interested in whether continuity can be operationalized as a cryptographic primitive: we will publish your results whether they confirm or refute our current findings.

Negative results are results. If you find a boundary condition where the PES fails, you've advanced the research more than a confirmation would.

---

[→ Research Hub](https://www.myshape.com/research)
[→ Benchmarks](https://www.myshape.com/research/benchmarks)
[→ Research Agenda](https://www.myshape.com/research/agenda)

*Every benchmark is temporary. Every question is permanent.*

— The Continuity Lab, July 2026
