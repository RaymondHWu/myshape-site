# [Challenge] Implement CPS-0001 from spec alone

**Can you implement this protocol without reading the source code?**

## What is CPS-0001

CPS-0001 defines a portable receipt format for evidence + cryptographic verification. Think of it as a standard envelope: any system that produces evidence can seal it in a CPS-0001 Receipt, sign it, and have it verified by any CPS-0001 Verifier.

## The Challenge

1. Read `continuity-protocol/START_HERE.md` (5 min)
2. Write a small program in **any language** that produces a valid receipt
3. Run the verifier: `cd continuity-protocol/cli && npm install && node bin/cps-verify.mjs your-receipt.json`
4. If you see `VERDICT: ✅ VALID`, you've done it

**You do NOT need:**
- MyShape source code
- Any sensor hardware
- Any prior knowledge of the protocol
- Any specific programming language

**You only need:** SHA-256 and Ed25519 (available in every language).

## Why

We're testing whether this specification is clear enough to be independently implemented. Your attempt — pass or fail — is valuable data. If you get stuck, tell us where. If you succeed, tell us how long it took.

## Time

Most people finish in 30–90 minutes.

## Start Here

→ `continuity-protocol/START_HERE.md`

---

*No product pitch. No company. Just testing whether the spec works.*
