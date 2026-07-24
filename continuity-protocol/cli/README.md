# CPS-0001 Reference Verifier — CLI

`cps-verify` verifies whether a Continuity Receipt conforms to CPS-0001 and whether its cryptographic commitments are valid.

**It does not independently determine whether the underlying evidence represents a real-world event.** A Receipt containing meaningless or fabricated evidence may still pass verification — because "conformant" is not the same as "true." The interpretation of the evidence belongs to the consuming application.

---

## Install

```bash
cd continuity-protocol/cli
npm install
```

Dependencies: `@noble/hashes`, `@noble/curves`. Zero MyShape imports.

## Usage

```bash
# From file
node bin/cps-verify.mjs ../test-vectors/valid/single-engine.json

# From stdin
cat receipt.json | node bin/cps-verify.mjs
```

## Test Vectors

See `../test-vectors/` for example receipts:

```
test-vectors/
├── valid/
│   ├── single-engine.json      ← one evidence block
│   └── multi-engine.json       ← two evidence blocks, chained
│
├── invalid/
│   ├── tampered-evidence.json  ← payload modified after signing
│   ├── bad-signature.json      ← wrong issuer public key
│   ├── expired.json            ← past expiration
│   └── broken-chain.json       ← predecessor hash mismatch
│
└── README.md
```

```bash
# 30-second verification
node bin/cps-verify.mjs ../test-vectors/valid/single-engine.json
# → VERDICT: ✅ VALID
```
