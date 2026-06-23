<!--
🔴 INTERNAL COMPLETE VERSION — v0.1
Contains ZK circuit design, proof generation algorithms, and mobile performance estimates.
Circuit design is public-ready at the conceptual level. Circuit implementation details and performance targets are internal.
See docs/.core/security-parameters-v0.1.md for boundary definitions.
-->

# ZK-Presence Proof System v0.1

## Zero-Knowledge Circuits for Motion-Native Identity Verification

**Status**: Technical Specification  
**Depends on**: Motion Signature Formalization v0.1, Challenge Protocol Formalization v0.1  
**Feeds into**: Multi-Factor Verification, MVP Architecture, SDK Implementation  

---

## 0. Design Philosophy

### 0.1 What ZK-Presence Proves

A ZK-Presence proof establishes the following statement without revealing the underlying data:

> "There exists a motion sequence $m$, captured by device $d$ at time $t$, such that:
> 1. $\text{MS}(m)$ matches the enrolled signature $\mathbf{z}_{\text{enroll}}$ within threshold $\tau$,
> 2. $\text{PES}(m) \geq \text{PES}_{\min}$ (the motion carries sufficient biological entropy),
> 3. $m$ was captured in response to challenge $c$ (binding to session),
> 4. $d$ satisfies device tier requirements,
> 5. None of $m$, $\text{MS}(m)$, or any identifiable features are revealed."

### 0.2 What ZK-Presence Does NOT Prove

- It does NOT prove "who" the user is (no identity binding)
- It does NOT prove the user is "human" in a general sense (that's Proof-of-Human, not Proof-of-Presence)
- It does NOT reveal anything that could be used to reconstruct the user's motion signature

### 0.3 Privacy Guarantees

| Property | Guarantee |
|:---|:---|
| **Zero-knowledge** | Verifier learns only "proof valid" + PES (which carries no identity information) |
| **Unlinkability** | Different proofs from the same user cannot be linked (without additional context) |
| **Non-reconstruction** | Proof does not contain enough information to reconstruct the motion or the signature |
| **Post-quantum readiness** | Hash-based commitments (Poseidon) are post-quantum secure; upgrade path for the proof system exists |

---

## 1. System Architecture

### 1.1 Three-Layer Proof Structure

```
Layer 1: Local Commitments (on-device)
  ├── Motion Signature commitment: C_MS = Hash(z_response)
  ├── Enrollment commitment: C_enroll = Hash(z_enroll)
  ├── PES commitment: C_PES = Hash(PES)
  └── Challenge binding: C_challenge = Hash(challenge_token)

Layer 2: ZK Circuit (on-device, proves over commitments)
  ├── Statement 1: Distance(z_response, z_enroll) ≤ τ
  ├── Statement 2: PES ≥ PES_min
  ├── Statement 3: C_challenge matches the session
  └── Statement 4: Device attestation is valid

Layer 3: Proof Aggregation (optional, for multi-session verification)
  └── Recursive proof over multiple Layer 2 proofs
```

### 1.2 Why This Architecture

**Separation of concerns**: 
- Layer 1 (commitments) uses Poseidon hash — fast, ZK-friendly, post-quantum secure
- Layer 2 (statements) uses Plonky2 — fast proving time on mobile, no trusted setup
- Layer 3 (aggregation) uses recursive SNARKs — enables continuous presence (v1.1+)

**Why not a single monolithic circuit**:
- Mobile devices have limited memory and compute
- Separate circuits can be optimized independently
- Commitment layer allows the verifier to check integrity without touching the ZK circuit
- Modularity enables future upgrades (swap Plonky2 for a faster proving system without changing Layer 1)

---

## 2. Layer 1: Commitment Scheme

### 2.1 Hash Function Choice

**Poseidon** is selected for all commitments:
- ZK-circuit-friendly (designed for minimal constraints in R1CS/PLONK arithmetization)
- Post-quantum secure (based on sponge construction, not discrete log)
- Fast on mobile (optimized for CPU, not just GPU)
- Standardized (used in Zcash, Mina, Polygon zkEVM)

**Parameters**:
- State size: 3 field elements (≈768 bits)
- Rate: 2 field elements
- Full rounds: 8
- Partial rounds: 56
- Field: BLS12-381 scalar field (same as Plonky2)

### 2.2 Commitment Generation

```
Function: CommitToSignature(z, salt)
Input:  z ∈ R^256 (Motion Signature vector)
        salt ∈ {0,1}^128 (fresh per proof)
Output: C ∈ F (single field element)

Steps:
  1. Quantize z to 8-bit integers: z_q = Quantize(z)
  2. Pack into field elements: z_F = Pack(z_q)  // 256 × 8-bit → 8 × field elements
  3. Poseidon(z_F || salt) → C
  4. Return C
```

**Quantization rationale**: Floating-point operations are not deterministic across platforms. Quantization to 8-bit ensures the same motion produces the same commitment on different devices (within tolerance).

### 2.3 PES Commitment

PES is a scalar in [0, 1]. To avoid revealing PES, it's committed:

$$C_{\text{PES}} = \text{Poseidon}(\text{Quantize}(\text{PES}, 16\text{-bit}) \;\|\; \text{salt}_{\text{PES}})$$

But note: PES itself is transmitted in the clear to the verifier (for threshold checking). The commitment is used only within the ZK circuit to prove PES was computed correctly from the same motion that produced the signature.

### 2.4 Challenge Binding

$$C_{\text{challenge}} = \text{Poseidon}(\text{challenge\_token} \;\|\; \text{nonce} \;\|\; \text{session\_id})$$

This binds the proof to a specific challenge session, preventing cross-session replay.

---

## 3. Layer 2: ZK Statement Circuits

### 3.1 Circuit 1: Signature Distance Check

**Public inputs**: $C_{\text{MS}}, C_{\text{enroll}}, \tau$ (threshold)  
**Private inputs**: $\mathbf{z}_{\text{response}}, \mathbf{z}_{\text{enroll}}, \text{salt}_{\text{MS}}, \text{salt}_{\text{enroll}}$

**Statement**:
1. $C_{\text{MS}} = \text{Poseidon}(\mathbf{z}_{\text{response}} \;\|\; \text{salt}_{\text{MS}})$  (commitment consistency)
2. $C_{\text{enroll}} = \text{Poseidon}(\mathbf{z}_{\text{enroll}} \;\|\; \text{salt}_{\text{enroll}})$
3. $\|\mathbf{z}_{\text{response}} - \mathbf{z}_{\text{enroll}}\|_2 \leq \tau \cdot (\|\mathbf{z}_{\text{response}}\|_2 + \|\mathbf{z}_{\text{enroll}}\|_2)$

**Circuit complexity**:

| Operation | Constraints (approx.) |
|:---|:---|
| Poseidon hash (2×) | ~1,200 (600 each) |
| Vector subtraction (256-dim) | ~256 |
| Squared L2 norm (2×) | ~512 (256 each) |
| Scalar comparison | ~50 |
| **Total** | **~2,018 constraints** |

**Optimization**: The distance check uses squared L2 norm to avoid expensive square root in the circuit. The threshold is squared correspondingly.

### 3.2 Circuit 2: PES Threshold Check

**Public inputs**: $C_{\text{PES}}, \text{PES}_{\min}$  
**Private inputs**: $\text{PES}, \text{salt}_{\text{PES}}$

**Statement**:
1. $C_{\text{PES}} = \text{Poseidon}(\text{PES} \;\|\; \text{salt}_{\text{PES}})$
2. $\text{PES} \geq \text{PES}_{\min}$

**Circuit complexity**: ~700 constraints (1 Poseidon + 1 comparison).

### 3.3 Circuit 3: Challenge Binding Check

**Public inputs**: $C_{\text{challenge}}, \text{challenge\_token}_{\text{public}}$  
**Private inputs**: $\text{challenge\_token}_{\text{private}}, \text{nonce}, \text{session\_id}$

**Statement**:
1. $C_{\text{challenge}} = \text{Poseidon}(\text{challenge\_token}_{\text{private}} \;\|\; \text{nonce} \;\|\; \text{session\_id})$
2. $\text{challenge\_token}_{\text{private}} = \text{challenge\_token}_{\text{public}}$ (challenge token matches)

**Circuit complexity**: ~650 constraints.

### 3.4 Circuit 4: Device Attestation Verification

This circuit does NOT verify the entire Apple/Google attestation (that happens on the verification node using platform APIs). Instead, it proves:

**Statement**: The device holds a valid attestation token $T$ that was issued for this specific session.

$$C_{\text{device}} = \text{Poseidon}(T \;\|\; C_{\text{challenge}})$$

This binds the device attestation to the challenge session. The verification node separately verifies the platform attestation signature.

**Circuit complexity**: ~650 constraints.

### 3.5 Total Circuit

Combined into a single Plonky2 circuit:

| Component | Constraints |
|:---|:---|
| Signature distance check | ~2,018 |
| PES threshold check | ~700 |
| Challenge binding | ~650 |
| Device binding | ~650 |
| Public input hashing | ~300 |
| **Total** | **~4,318 constraints** |

For Plonky2 on BLS12-381, this is a **small circuit** (typical Plonky2 circuits are 10⁴–10⁶ constraints).

---

## 4. Proof Generation

### 4.1 Proving on Mobile

**Plonky2 Performance Estimates** (based on benchmarks on Snapdragon 8 Gen 2 / A17 Pro):

| Phase | Time (ms) | Memory |
|:---|:---|:---|
| Witness generation | 50–100 | ~50 MB |
| Proving key loading | 100–200 (one-time) | ~10 MB |
| PLONK proof generation | 500–1,500 | ~100 MB |
| Proof serialization | 1–5 | ~1 KB |
| **Total (first proof)** | **~800–1,800 ms** | **~150 MB** |
| **Total (subsequent proofs)** | **~600–1,600 ms** | **~150 MB** |

**Key insight**: Proof generation fits within a single-digit second budget. The bottleneck is PLONK prover time (~1s), not witness generation. This is acceptable for a verification flow where the user is already spending 4-5 seconds performing the challenge.

### 4.2 Proof Size

| Component | Size |
|:---|:---|
| Plonky2 proof | ~800 bytes |
| Public inputs (4 field elements) | ~128 bytes |
| PES (cleartext) | 4 bytes (float32) |
| Timestamp | 8 bytes (uint64) |
| **Total** | **~940 bytes** |

Proof size is under 1KB — negligible for network transmission.

### 4.3 Verification on the Node

| Phase | Time (ms) |
|:---|:---|
| Proof deserialization | <1 |
| Public input verification | <1 |
| PLONK proof verification | 5–20 |
| PES threshold check | <1 |
| Nonce replay check | 1–5 (Redis lookup) |
| **Total** | **~10–30 ms** |

Verification is extremely fast — a single node can handle thousands of verifications per second.

---

## 5. Privacy Analysis

### 5.1 Information Leakage

What a network observer sees:
- ZK proof (opaque bytes, reveals nothing)
- PES (a scalar in [0, 1] — reveals "how biological" the motion was, but not who performed it)
- Timestamp
- Device attestation token (platform-specific, reveals only that the device passed integrity check)

What the verification node sees:
- Same as above
- Nonce (one-time use, reveals nothing about the user)

What NO ONE sees:
- Raw motion data
- Motion Signature vector
- Feature vectors
- Skeletal data
- Camera frames
- IMU readings
- Enrollment data

### 5.2 PES Privacy

PES itself carries a potential privacy risk: if an attacker knows a target's exact PES distribution, they might be able to correlate proofs.

**Mitigation**: PES is quantized to 8-bit resolution (0–255 → mapped to 0.0–1.0 in 256 steps). This reduces PES granularity from float32 (~4 billion values) to 256 values, making PES-based correlation statistically weak. Additionally, PES is a population-level metric — many users will have similar PES values (~0.70–0.85).

### 5.3 Unlinkability

Without additional context (session ID, timestamp), two proofs from the same user are computationally unlinkable. This property holds because:
- Each proof uses a fresh salt
- Poseidon commitments are hiding
- The ZK proof reveals nothing beyond the statement's truth

However, **practical unlinkability requires the verifier to not log timestamps or device IDs**. If the verifier logs `(device_id, timestamp)` pairs, proofs can be linked temporally. This is acceptable for the intended use case (high-value operation verification) where some context is necessarily known.

---

## 6. Upgrade Path

### 6.1 v1.1: Proof Aggregation

For continuous presence, multiple proofs (e.g., 10 proofs over 10 minutes) are aggregated into a single recursive proof using Plonky2's native recursion.

**Recursive circuit**: ~10,000 constraints (verifies 10 inner proofs + aggregates).
**Aggregate proof size**: ~1.5 KB (constant, independent of number of inner proofs).

### 6.2 v1.1: Multi-Device Aggregation

For multi-device presence, proofs from different devices (each with its own key) are aggregated. The aggregation circuit additionally verifies temporal proximity (timestamps within 50ms).

### 6.3 Post-Quantum Upgrade

Plonky2 uses BLS12-381, which is not post-quantum secure (pairing-based). For post-quantum security:
- **Short term**: Layer 1 (Poseidon commitments) is already post-quantum. Layer 2 proofs protect only the session, not long-term secrets.
- **Long term**: Migrate Layer 2 to a post-quantum proof system (e.g., STARKs, or lattice-based SNARKs once mature). The modular architecture makes this feasible without changing Layer 1.

---

## 7. Implementation Recommendations

### 7.1 Mobile Proving

- Use Plonky2's `no_std` Rust implementation, compiled to mobile targets via `uniffi` (iOS) and JNI (Android)
- Pre-generate proving key on the server; download once during enrollment (100ms + 10MB)
- Cache proving key locally; refresh only on SDK update
- Fallback: If device is too slow for on-device proving (<1% of devices), offer a "delegated proving" mode where proof is generated by a secure enclave in the cloud (tradeoff: reveals commitments to the enclave, but not raw data)

### 7.2 Verification Node

- Stateless verification — all inputs are in the proof
- No database required for verification (only nonce store + revocation list)
- Can be deployed as serverless functions (Cloudflare Workers, AWS Lambda)

---

*This specification v0.1. Circuit details will be refined based on implementation benchmarks and security audit findings.*
