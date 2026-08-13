# @thecontinuitylab/myshape

> **Motion-signature verification for continuity proofs. CPS-0001 compatible.**

[![CPS-0001](https://img.shields.io/badge/CPS-0001-v1.0--RC-gold)](https://github.com/myshapeprotocol/myshape-protocol)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)
[![npm](https://img.shields.io/badge/npm-@thecontinuitylab/myshape-red)](https://www.npmjs.com/package/@thecontinuitylab/myshape)

Reference implementation of the MyShape motion-signature engine. Sensor data in → verification result out. Research by [The Continuity Lab](https://thecontinuitylab.org).

## Install

```bash
npm install @thecontinuitylab/myshape
```

## Quick Test

```ts
import { verifyContinuity } from "@thecontinuitylab/myshape";

const result = await verifyContinuity({
  imuSamples: [],       // required — IMU sensor samples (EE-002)
  cameraSamples: [],    // optional — camera motion (EE-002 cross-modal)
  frames: [],           // optional — pose frames (EE-001 PES)
  timestamps: [],       // optional — pose frame timestamps (EE-001)
  challengeResults: [], // optional — challenge rounds (EE-003)
});

// → { verdict, confidence, evidence, threatReport }
```

`verifyContinuity` runs a 4-layer pipeline — Presence Entropy Score (EE-001), Cross-Modal Causal Coupling (EE-002), Challenge-Response (EE-003), and Verification Session aggregation (VS-001). Each layer contributes weighted evidence toward a final `verdict` and `confidence`.

## CPS-0001 Receipts

For engine-independent continuity receipts, the package also exports the CPS-0001 layer — `buildReceipt`, `signReceipt`, `verifyReceipt`, `generateKeyPair`, plus full schema checks (`verifySchema`, `verifyAssertions`, `verifyTemporal`, `verifyFreshness`). Receipts are Ed25519-signed and interoperable across implementations.


