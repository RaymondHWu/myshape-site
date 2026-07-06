# MyShape Protocol — Technical Progress Update · July 2026

> **The Sovereign Continuity Layer for the Simulation Age.**
>
> Identity tells you who someone claims to be. Continuity tells you they are still them.

---

## State of the Protocol

MyShape Protocol is an open-source **continuity layer** that verifies human presence without biometrics. Motion-signature verification. Zero-knowledge proofs. On-device processing. 105k+ lines of code across 654 files, 236 tests, 27 page routes, 21 API endpoints, and a multi-platform publishing matrix.

The protocol is live at **[myshape.com](https://www.myshape.com)**.

---

## What We Shipped (v0.1 → v2.0 Genesis)

### Core Protocol

| Component | Status | Description |
|:---|:---|:---|
| **4D PES Engine** | ✅ Live | 128-dim motion vector from MediaPipe 33-pt pose → SST 18-pt topology |
| **Motion Demo** | ✅ Live | Real-time camera capture, video file import, PES scan with countdown timer |
| **Genesis Ritual** | ✅ Live | OTP-verified motion-signature enrollment → sovereign protocol node |
| **Verification Dashboard** | ✅ Live | 6-rule ZK verification with real-time visual feedback |
| **Presence Receipt** | ✅ Spec | Cryptographic proof of real-time human presence (~250 bytes) |

### Developer Toolchain (NEW — July 2026)

```
POST /api/dev/register    → Deploy a protocol anchor in 60 seconds
POST /api/dev/activate    → Activate node with real-time feedback
GET  /api/nodes/count     → Live protocol node count
GET  /api/identity?email= → Node lookup
GET  /api/nodes/stats     → Protocol-wide statistics
```

- **No wallet required.** No invite. No identity verification.
- **curl-native.** Every endpoint ships with cross-shell curl examples.
- **Dev sandbox** at [myshape.com/developers](https://www.myshape.com/developers) with 3-stage onboarding, SDK reference, and API playground.

### Publishing Infrastructure

| Platform | Status | Method |
|:---|:---|:---|
| **Bluesky** | ✅ Live | AT Protocol via createSession + createRecord |
| **X / Twitter** | ✅ Live | OAuth 1.0a manual signing (HMAC-SHA1) |
| **LinkedIn** | ✅ Live | Organization page posting via `/v2/posts` + image upload |
| **Farcaster** | ✅ Live | Neynar API v2 |
| **Discord** | ✅ Live | Webhook embeds |
| **Telegram** | ✅ Live | Bot API |
| **Reddit** | ✅ Live | Password grant → oauth.reddit.com submit |

All publishing flows through a single rate-limited endpoint: `POST /api/matrix/publish`.

### Monitoring

| Monitor | Interval | Scope |
|:---|:---|:---|
| **API Monitor** | 60s | Dev endpoint crash/signal detection (409/429) → Discord |
| **Feedback Monitor** | 30min | GitHub + HN (Algolia) + Reddit mentions → Discord |
| **Reddit Monitor** | 30min | r/ML, r/rust, r/computervision, r/crypto, r/privacy |

Signals archive: `scripts/api-monitor/signals-archive.json` for developer-path analysis.

### Research

| Document | Status |
|:---|:---|
| **PES Benchmark v0.2** | Published — 54 real human samples, 0.3960 Human-AI gap, 95% CI |
| **Protocol Spec v0.1** | Published — wireframe anatomy, SST topology, entropy growth protocol |
| **Threat Model** | Published — 4 attack vectors, adversarial replay, screen replay, deepfake |
| **Unforgeability Proof** | Formalized — structural L2 loss argument |
| **Challenge Protocol** | Formalized — challenge-response with CSPRNG nonce |

---

## Architecture

```
Camera / Video Import
        │
        ▼
MediaPipe Pose (33-pt landmarks)
        │
        ▼
SST Topology (18-pt skeleton — head, shoulders, elbows, wrists, hips, knees, ankles)
        │
        ▼
4-Dimensional PES Engine
  ├─ Kinematics     (velocity vectors, limb angular displacement)
  ├─ Acceleration   (rate of velocity change, Newtonian jerk)
  ├─ Jerk Spectrum  (FFT → 1/f scaling, tremor band 8-12 Hz)
  └─ Entropy Score  (sample entropy, Hurst exponent)
        │
        ▼
128-dim Motion Vector → ZK-SNARK Proof (~250 bytes)
        │
        ▼
Genesis Enrollment → Continuity Proof anchored on-chain
```

**All processing is on-device. Zero raw data leaves the device.**

---

## Tech Stack

| Layer | Technology |
|:---|:---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + Tailwind CSS 4 |
| 3D | Three.js + @react-three/fiber 9.x |
| Motion | MediaPipe Pose + Framer Motion |
| Crypto | @noble/hashes (SHA-256), @noble/curves (ZK) |
| Backend | Supabase 2.x |
| Email | Resend 6.x |
| WASM | Rust → wasm-pack (myshape_wasm) |
| Infra | PM2 (Windows daemons), Vercel (deployment) |
| Monitoring | PM2 + Discord webhooks + signals archive |

---

## What's Next

### Q3 2026 — Protocol Hardening

- [ ] **WASM Engine** — Move PES computation to browser via Rust WASM (bundle shipped, integration WIP)
- [ ] **Challenge Protocol v1** — CSPRNG challenge-response with signed nonces
- [ ] **Multi-Factor Verification** — Combine motion + device fingerprint + network context
- [ ] **Genesis Cohort 100** — First 100 sovereign protocol nodes with verified motion signatures
- [ ] **Continuity Proof on-chain** — Anchor ZK proofs to EVM-compatible chain

### Q4 2026 — Network Effects

- [ ] **Identity Mesh** — Peer-to-peer node discovery and cross-verification
- [ ] **Agent Identity** — AI agent registration protocol (non-human sovereign nodes)
- [ ] **SDK v1.0** — `npm install @myshape/sdk` with full TypeScript support
- [ ] **Mobile Capture** — PWA motion capture for iOS/Android

---

## Participate

| Channel | Link |
|:---|:---|
| **Website** | [myshape.com](https://www.myshape.com) |
| **Developers** | [myshape.com/developers](https://www.myshape.com/developers) |
| **GitHub** | [github.com/myshapeprotocol](https://github.com/myshapeprotocol) |
| **Discord** | [discord.gg/zr8Tczard](https://discord.gg/zr8Tczard) |
| **Substack** | [The Entropy Gap](https://open.substack.com/pub/myshape) |
| **Contact** | protocol@myshape.com |

---

## Colophon

- **105,933** lines of code across **654** files
- **236** tests · **27** page routes · **21** API endpoints · **43** components
- **11** published blog posts · **9** formal technical documents
- **7** social platforms integrated · **3** PM2 monitoring daemons
- **0** bio-identification data stored · **0** raw frames transmitted · **100%** on-device processing

*July 6, 2026 · MyShape Protocol Core Team*
