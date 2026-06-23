<!--
🔴 INTERNAL COMPLETE VERSION — v0.1
This document contains core security parameters (weight tables, RecentRiskLoad parameters, security margin data, attack cost matrix, FAR/FRR targets).
DO NOT PUBLISH. For public version, strip all quantitative parameters and vulnerability analysis.
See docs/.core/security-parameters-v0.1.md for boundary definitions.
-->

# Multi-Factor Presence Verification — Formal Specification v0.1

## Defense-in-Depth Architecture for the Presence Protocol

**Status**: Technical Specification  
**Depends on**: Motion Signature Formalization v0.1, Challenge Protocol Formalization v0.1, Whitepaper §6  
**Feeds into**: SDK Specification, E4 (Multi-Factor Coupling Experiment), E5 (Attack Cost Simulation)  

---

## 0. Design Principle

### 0.1 The Factor Composition Theorem (Informal)

> The security of a multi-factor presence verification system is not the sum of its factors. It is the **product of their failure probabilities** — provided the factors are physically coupled such that compromising one factor does not reduce the cost of compromising another.

**Definition 0.1 (Factor Independence)**. Two factors $F_i, F_j$ are *attack-independent* if:

$$\text{Cost}(\text{break } F_i \land \text{break } F_j) = \text{Cost}(\text{break } F_i) + \text{Cost}(\text{break } F_j) + \text{Cost}(\text{synchronize})$$

where $\text{Cost}(\text{synchronize}) > 0$ represents the engineering cost of simultaneously defeating both factors in a physically consistent manner.

**Definition 0.2 (Factor Coupling)**. Two factors are *physically coupled* if defeating one factor imposes physical constraints on the attack against the other factor, such that:

$$\text{Cost}(\text{break } F_i \land \text{break } F_j) > \text{Cost}(\text{break } F_i) + \text{Cost}(\text{break } F_j)$$

The inequality is strict — coupling multiplies cost, it doesn't add.

---

## 1. Factor Definitions

### 1.1 Factor Taxonomy

| Factor | Symbol | Domain | Type | Coupling |
|:---|:---|:---|:---|:---|
| Motion Signature | $M$ | $[0, 1]$ | Biological | Coupled to $T$, $S$ (sensor) |
| Device Attestation | $D$ | $[0, 1]$ | Hardware | Coupled to $S$, $M$ (via IMU) |
| Context Graph | $C$ | $[0, 1]$ | Behavioral | Loose coupling to $T$ |
| Temporal Continuity | $T$ | $[0, 1]$ | Temporal | Coupled to $M$ |
| CoPresence | $P$ | $[0, 1]$ | Network | Coupled to $D$ (multi-device) |

### 1.2 Factor 1: Motion Signature Score $M$

$$M = 1 - \frac{\|\mathbf{z}_{\text{enroll}} - \mathbf{z}_{\text{response}}\|_2}{\|\mathbf{z}_{\text{enroll}}\|_2 + \|\mathbf{z}_{\text{response}}\|_2}$$

Where $\mathbf{z} \in \mathbb{R}^{256}$ is the whitened Motion Signature vector (per Motion Signature Formalization §2).

**Sub-scores** (for diagnostics; not individually exposed to avoid gradient leakage):

$$M_{\Phi} = 1 - \frac{\|\Phi_{\text{enroll}} - \Phi_{\text{response}}\|_2}{\|\Phi_{\text{enroll}}\|_2 + \|\Phi_{\text{response}}\|_2}$$

for each feature group $\Phi \in \{\Phi_K, \Phi_A, \Phi_J, \Phi_{J_{\text{spec}}}, \Phi_T, \Phi_C, \Phi_S\}$.

**Anomaly flag**: If any $M_{\Phi} < \tau_{\Phi}$ (per Challenge Protocol §4.2), the response is flagged even if the composite $M$ passes. This is the "break-one-break-all" principle for feature dimensions.

### 1.3 Factor 2: Device Attestation Score $D$

$$D = \prod_{i=1}^{4} d_i$$

where each $d_i \in [0, 1]$ is a sub-factor:

| Sub-factor | Symbol | Measurement | Trust Basis |
|:---|:---|:---|:---|
| Platform integrity | $d_1$ | TEE/SE attestation — device not jailbroken/rooted | Hardware root of trust |
| Sensor integrity | $d_2$ | Camera + IMU driver signatures verified | OS-level code signing |
| CMOS fingerprint | $d_3$ | Sensor noise pattern matches enrolled device | Physical unclonability |
| SDK integrity | $d_4$ | SDK binary hash matches attested version | Code signing + TEE verification |

**Device Tier Mapping**:

| Tier | Requirements | $D_{\min}$ | Max Operation Value |
|:---|:---|:---|:---|
| Tier 1 | $d_2 > 0$ (any device with camera) | 0.3 | $1K |
| Tier 2 | $d_1 > 0.5 \land d_2 > 0.5 \land d_3 > 0$ | 0.6 | $100K |
| Tier 3 | $d_1 > 0.9 \land d_2 > 0.9 \land d_3 > 0.5 \land d_4 > 0.9$ | 0.85 | $10M+ |

**Definition 1.3.1 (Device Risk Tier Violation)**. If $D < D_{\min}$ for the operation's required tier, the verification is rejected regardless of other factor scores. This is a **hard gate**, not a weighted contribution.

### 1.4 Factor 3: Context Score $C$

$$C = 1 - \prod_{i=1}^{4} (1 - c_i)$$

where each $c_i \in [0, 1]$ measures contextual normality:

| Sub-factor | Symbol | Definition |
|:---|:---|:---|
| Geographic continuity | $c_1$ | $e^{-\alpha \cdot \max(0, v_{\text{implied}} - v_{\max})}$ where $v_{\text{implied}} = \Delta\text{location} / \Delta t$ |
| Device history consistency | $c_2$ | Fraction of recent verifications from the same device |
| Temporal normality | $c_3$ | $1 - |\text{hour} - \mu_{\text{hour}}| / 12$ based on user's historical activity distribution |
| Behavioral pattern match | $c_4$ | Similarity of operation characteristics (value, type, counterparty) to historical baseline |

**Definition 1.4.1 (Context Anomaly)**. A context sub-factor $c_i < 0.3$ triggers elevated risk regardless of the composite $C$. A sub-factor $c_i < 0.1$ triggers a soft rejection (requires additional factor escalation).

### 1.5 Factor 4: Temporal Continuity Score $T$

$$T = f_{\text{stability}} \cdot f_{\text{fatigue}} \cdot f_{\text{drift}}$$

**Definition 1.5.1 (Motion Stability)**.

$$f_{\text{stability}} = 1 - \min\left(1, \frac{\|\mathbf{z}_t - \mathbf{z}_{t-\Delta t}\|}{\sigma_{\text{intra}} \cdot k}\right)$$

where $k = 3$ (three standard deviations = p < 0.003 under normal distribution). Values beyond $3\sigma$ trigger the drift detector.

**Definition 1.5.2 (Fatigue Model)**.

$$f_{\text{fatigue}} = 1 - \min\left(1, \frac{N_{\text{recent}}}{N_{\max}} \cdot e^{-\lambda(t - t_{\text{last}})}\right)$$

where $N_{\text{recent}}$ is the number of verifications in the recent window (15 minutes), $N_{\max} = 20$, and $\lambda$ is the recovery rate (half-life: 5 minutes).

**Rationale**: After 20 verifications in 15 minutes, human motion quality degrades measurably. An attacker simulating fatigue would systematically lower their motion quality rather than maintain it — which itself is detectable because their "rested" baseline wouldn't match the enrolled signature.

**Definition 1.5.3 (Drift Detection — Temporal Drift Attack Defense)**.

$$f_{\text{drift}} = 1 - \max\left(0, \frac{\mu_{\text{recent}} - \mu_{\text{historical}}}{\sigma_{\text{historical}}} - 1.5\right)$$

where:
- $\mu_{\text{recent}}$: mean motion score over the last 50 verifications
- $\mu_{\text{historical}}$: mean motion score over all verifications (excluding recent)
- $\sigma_{\text{historical}}$: historical standard deviation

**Detection rationale**: An attacker using gradual approximation (80% → 85% → 90% → 95%) will produce a monotonic upward trend in $\mu_{\text{recent}}$. A real user exhibits stationary fluctuation. The drift detector triggers when $\mu_{\text{recent}}$ exceeds $\mu_{\text{historical}} + 1.5\sigma$ — a statistically significant upward shift inconsistent with natural variation.

### 1.6 Factor 5: CoPresence Score $P$ (Future — v1.2+)

$$P = 1 - \prod_{i=1}^{k} (1 - p_i)$$

where $k$ is the number of co-present entities and $p_i \in [0, 1]$ is the presence score of each co-present entity.

**Co-presence types**:

| Type | Weight | Requirement |
|:---|:---|:---|
| Multi-device (same user) | 0.6 | Two devices with independent sensors, physically co-located (verified via BLE/UWB proximity) |
| Multi-human (different users) | 0.8 | Two or more verified humans in the same physical space |
| Spatial anchor | 0.4 | Fixed trusted device in the space (e.g., home hub, office beacon) |

$P$ is **not required for v1.0 MVP** but is defined here for architectural completeness.

---

## 2. Score Composition

### 2.1 The Presence Score Function

$$\text{PresenceScore}(t) = \sum_{i \in \{M, D, C, T, P\}} w_i(t) \cdot F_i$$

where $F_i \in [0, 1]$ are the individual factor scores and $w_i(t)$ are time-adaptive weights satisfying:

$$\sum_i w_i(t) = 1, \quad w_i(t) \geq 0$$

### 2.2 Static Weight Tables (Fallback)

When context data is insufficient (new user, cold start):

| Risk Tier | Example Value | $w_M$ | $w_D$ | $w_C$ | $w_T$ | $w_P$ |
|:---|:---|:---|:---|:---|:---|:---|
| Minimal | <$100 | 0.65 | 0.25 | 0.10 | 0.00 | 0.00 |
| Low | $100–$1K | 0.55 | 0.30 | 0.15 | 0.00 | 0.00 |
| Medium | $1K–$100K | 0.45 | 0.30 | 0.15 | 0.10 | 0.00 |
| High | $100K–$1M | 0.35 | 0.30 | 0.15 | 0.15 | 0.05 |
| Critical | $1M–$10M | 0.25 | 0.30 | 0.15 | 0.20 | 0.10 |
| Extreme | >$10M | 0.20 | 0.30 | 0.15 | 0.20 | 0.15 |

### 2.3 Dynamic Weight Adaptation (Patch 3 — Formalized)

**Definition 2.3.1 (Recent Risk Load)**.

$$\text{RecentRiskLoad}(t) = \sum_{k: t - t_k \leq \Delta T} \text{Value}_k \cdot e^{-\lambda (t - t_k)}$$

where:
- $\text{Value}_k$ is the value at risk for operation $k$ (in USD)
- $t_k$ is the timestamp of operation $k$
- $\Delta T = 3600\text{s}$ (1 hour window)
- $\lambda = \ln(2) / 900\text{s}$ (15-minute half-life)

**Definition 2.3.2 (Effective Risk Level)**.

$$\text{EffectiveRisk} = \max(\text{Value}_{\text{current}}, \text{RecentRiskLoad}(t))$$

The effective risk determines the weight allocation — not the nominal value of the current operation alone.

**Definition 2.3.3 (Weight Adaptation Function)**.

$$w_i(t) = w_i^{\text{static}}(\text{EffectiveRisk}) \cdot \frac{1}{1 + \alpha \cdot \text{saturation}_i(t)}$$

where $\alpha$ is the adaptation rate (default: 0.5) and:

$$\text{saturation}_i(t) = \frac{\text{count of factor } i \text{ validations in } [t - \Delta T, t]}{\max\_\text{validations}}$$

**Rationale**: If factor $M$ (Motion) has been validated 50 times in the past hour, its marginal security contribution diminishes — the attacker has had 50 opportunities to observe and adapt. The weight should gradually shift toward less-sampled factors ($C$, $T$). This prevents "factor fatigue" — the attacker repeatedly probing the motion signature while the context and temporal factors remain unexercised.

### 2.4 Hard Gates

Certain conditions trigger hard rejection regardless of composite score:

| Condition | Gate Type | Behavior |
|:---|:---|:---|
| $D < D_{\min}(\text{tier})$ | Hard | Immediate rejection |
| $\text{PES} < 0.65$ | Hard | Immediate rejection |
| $M_{\Phi_S} < 0.5$ (Sensor consistency) | Hard | Immediate rejection — likely screen forgery |
| $\text{Nonce seen}$ | Hard | Immediate rejection — replay |
| $t_{\text{latency}} < 50\text{ms}$ | Hard | Immediate rejection — likely automated |
| $t_{\text{latency}} > t_{\text{window}}$ | Hard | Immediate rejection — timeout |

| Condition | Gate Type | Behavior |
|:---|:---|:---|
| $f_{\text{drift}} < 0.3$ | Soft | Escalate to next risk tier |
| $c_1 < 0.1$ (geographic anomaly) | Soft | Require additional factor verification |
| $T < 0.5$ | Soft | Reduce operation value ceiling by 10× |

---

## 3. Threshold Determination

### 3.1 Risk-Calibrated Thresholds

$$\tau_{\text{effective}} = \tau_{\text{base}} + (1 - \tau_{\text{base}}) \cdot \text{RiskFactor}$$

where:

$$\text{RiskFactor} = \min\left(1, \frac{\log_{10}(\text{EffectiveRisk} / R_0)}{\log_{10}(R_{\max} / R_0)}\right)$$

| Parameter | Value | Description |
|:---|:---|:---|
| $\tau_{\text{base}}$ | 0.60 | Baseline threshold for minimal-risk operations |
| $R_0$ | $10 | Reference risk (USD) |
| $R_{\max}$ | $10^7$ | Maximum risk (USD) |

**Example thresholds**:

| Effective Risk | $\tau_{\text{effective}}$ |
|:---|:---|
| $10 | 0.60 |
| $1K | 0.69 |
| $100K | 0.77 |
| $1M | 0.83 |
| $10M | 0.89 |

### 3.2 False Accept / False Reject Tradeoff

The protocol targets:

| Operation Value | Target FAR | Target FRR | Rationale |
|:---|:---|:---|:---|
| <$1K | $10^{-3}$ | $10^{-2}$ | Convenience > security |
| $1K–$100K | $10^{-4}$ | $5 \times 10^{-2}$ | Balanced |
| $100K–$1M | $10^{-5}$ | $10^{-1}$ | Security > convenience |
| >$1M | $10^{-6}$ | $2 \times 10^{-1}$ | Security dominant |

FRR scales with risk — high-value operations can tolerate higher false reject rates (users are willing to retry for $1M transactions).

---

## 4. Attack Cost Under Multi-Factor

### 4.1 Factor Attack Cost Matrix

| Factor | Solo Attack Cost (T₁) | Attack Type | Scalable? |
|:---|:---|:---|:---|
| $M$ (Motion) | $1K–$40K | B2a AI forgery | Per-target |
| $D$ (Device) | $5K–$150K (malicious app) / $200K–$6M (zero-day) | B3 sensor injection | Per-device-model |
| $C$ (Context) | $10K–$100K | Location spoofing + behavior forgery | Per-target |
| $T$ (Temporal) | $100K–$500K | Sustained approximation campaign (requires 50+ sessions) | Per-target |
| $P$ (CoPresence) | $200K–$1M+ | Simultaneous multi-device compromise | Per-physical-location |

### 4.2 Multi-Factor Attack Cost

**Theorem 4.2.1 (Multi-Factor Cost Superadditivity)**. For physically coupled factors:

$$\text{Cost}(\text{break } F_1 \land \ldots \land F_k) \geq \sum_{i=1}^{k} \text{Cost}(\text{break } F_i) + \sum_{i<j} \text{Cost}(\text{sync } F_i, F_j)$$

The synchronization cost between factors is non-zero because:
- **M–D synchronization**: AI-forged motion must be physically consistent with the (possibly compromised) device's sensor signatures — requires either physical execution (B2b) or multi-sensor injection (B3 Level 2+)
- **M–T synchronization**: AI forgery quality must improve across sessions without triggering drift detection — requires modeling the target's natural variance envelope
- **D–C synchronization**: Compromised device must appear at the geographically expected location — requires physical presence or sophisticated network spoofing
- **M–C–T synchronization**: Motion forgery must be consistent with the user's historical behavior patterns across time — requires long-term behavioral modeling

### 4.3 Economic Security Margin

**Definition 4.3.1 (Security Margin)**.

$$\text{SecurityMargin}(\text{Value}) = \frac{\text{AttackCost}(k \text{ factors})}{\text{Value}}$$

**Target**: $\text{SecurityMargin} \gg 1$ for all supported operation values.

| Effective Risk | Factors Required | Est. Attack Cost | Security Margin |
|:---|:---|:---|:---|
| $10 | 2 (M + D basic) | >$5K | 500× |
| $1K | 2 (M + D) | >$10K | 10× |
| $100K | 3 (M + D + C) | >$100K | ~1× |
| $1M | 4 (M + D + C + T) | >$500K | ~0.5× ⚠️ |
| $10M | 5 (all) | >$2M | ~0.2× 🔴 |

**Critical observation**: The security margin drops below 1× at high operation values when using current cost estimates. This is NOT a protocol failure — it reflects the reality that **no single verification event can provide infinite security**.

**Mitigation for $1M+ operations**:
1. Require multi-session verification (not a single challenge — a sequence over 5–10 minutes)
2. Require CoPresence (multiple trusted entities)
3. Implement time-delayed execution (verification → 30-minute hold → execution)
4. Require out-of-band confirmation (separate channel)

These mitigations push the effective attack cost above $5M+ for $10M operations, restoring the security margin.

---

## 5. Temporal Dynamics

### 5.1 Session Model

A **presence session** is a continuous period of verified presence. Within a session:

- Motion Signature is verified at the start
- Subsequent verifications use lighter-weight checks (rapid challenge, reduced feature set)
- The session has a maximum duration (default: 30 minutes)
- After session expiry, full re-verification is required

### 5.2 Session State Machine

```
[Unverified] ──(full challenge)──▶ [Verified] ──(rapid re-check every N minutes)──▶ [Verified]
                                       │
                                       ├──(session timeout)──▶ [Unverified]
                                       ├──(context anomaly)──▶ [Elevated Risk]
                                       └──(drift detected)──▶ [Elevated Risk]

[Elevated Risk] ──(full challenge + extra factor)──▶ [Verified]
                  ──(failure)──▶ [Unverified]
```

### 5.3 Factor Score Persistence

Factor scores have limited temporal validity:

| Factor | Persistence | Decay |
|:---|:---|:---|
| $M$ | Session only | Full re-verification on new session |
| $D$ | 24 hours | Re-attestation on device change or OS update |
| $C$ | Continuous | Exponentially weighted moving average, half-life 7 days |
| $T$ | Continuous | Exponentially weighted moving average, half-life 30 days |

---

## 6. Integration with Proof of Intent

### 6.1 Operation Binding

The Presence Score is cryptographically bound to the operation it authorizes:

$$\text{IntentProof} = \text{Sign}_{\text{device}}\big(\text{PresenceScore}, \text{OperationHash}, \text{Timestamp}, \text{Nonce}\big)$$

The IntentProof is:
- Non-transferable (bound to the specific operation)
- Time-limited (valid for a single use within a narrow window)
- Verifiable by any third party without access to the raw presence data

### 6.2 Operation Value Ceiling

The Presence Score maps to a maximum authorizable operation value:

$$\text{MaxValue} = V_0 \cdot 10^{k \cdot \text{PresenceScore}}$$

where $V_0 = 10$ and $k = 6$, yielding:

| PresenceScore | MaxValue |
|:---|:---|
| 0.60 | $39,810 |
| 0.70 | $158,489 |
| 0.80 | $630,957 |
| 0.90 | $2,511,886 |
| 0.95 | $5,011,872 |

The mapping is deliberately super-linear — a small score improvement unlocks a disproportionately larger value ceiling, incentivizing users to maintain high-quality presence signals.

---

## 7. Summary

The Multi-Factor Presence Verification framework provides:

1. **Five defense layers** (M, D, C, T, P) with formal score definitions and coupling relationships
2. **Dynamic risk-adaptive weighting** (Patch 3) that responds to cumulative RecentRiskLoad and factor saturation
3. **Hard gates** for conditions that indicate definitive attacks (replay, screen forgery, low entropy)
4. **Economically calibrated thresholds** that map operation value to required security level
5. **Multi-factor attack cost superadditivity** — physically coupled factors cost more to break jointly than the sum of their individual break costs
6. **Temporal dynamics** including session management, score persistence, and drift detection
7. **Operation binding** via IntentProof — cryptographic coupling of presence verification to the authorized action

The framework is designed to degrade gracefully: as AI capabilities advance, additional factors and stricter thresholds can be deployed without architectural changes. The protocol's security is not a fixed point but a **tunable function** of risk tolerance, AI capability, and factor availability.

---

*This specification is v0.1. It will be updated as experimental data (E4, E5) provides empirical grounding for the cost estimates and factor coupling assumptions.*
