# Continuity Protocol

**CPS-0001 v1.0-RC** · Apache 2.0 · [The Continuity Lab](https://thecontinuitylab.org)

## Structure

```
continuity-protocol/
├── reference-verifier/       # Zero-dependency verifier (TypeScript)
│   └── verifier.ts
├── test-vectors/             # JSON test vectors
│   ├── valid-receipt-01.json
│   ├── valid-receipt-02-chained.json
│   ├── expired.json
│   ├── tampered-evidence.json
│   └── broken-chain.json
├── conformance/              # Conformance test suite
│   └── conformance.test.ts
└── README.md
```

## Reference Verifier

The verifier is **engine-independent**. It imports nothing from MyShape. It processes any CPS-0001-conformant receipt regardless of which evidence engine produced it.

```typescript
import { verifyReceipt } from "./reference-verifier/verifier";

const result = await verifyReceipt(receipt);
// { status: "VALID" } or { status: "INVALID", reason: "EXPIRED", detail: "..." }
```

V₁–V₇ checks: schema → signature → assertions → temporal → evidence integrity → freshness → predecessor reference.

## Test Vectors

| Vector | Expected |
|:---|:---|
| `valid-receipt-01.json` | V₁–V₆ pass |
| `valid-receipt-02-chained.json` | V₁–V₆ pass, V₇ chains to valid-01 |
| `expired.json` | V₆: EXPIRED |
| `tampered-evidence.json` | V₅: EVIDENCE_TAMPERED |
| `broken-chain.json` | V₇: CHAIN_BROKEN |

## Conformance

Any team claiming CPS-0001 compatibility must pass the conformance suite:

```bash
npx vitest run continuity-protocol/conformance/
```

10 conformance scenarios, 23 assertions. Zero dependencies on MyShape engine code.

## Full Specification

https://myshape.com/research/notes/008-continuity-protocol-core
