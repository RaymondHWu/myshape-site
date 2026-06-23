<!--
🔴 INTERNAL COMPLETE VERSION — v0.1
This document contains core security parameters (challenge entropy, coupling constraint algorithms, timing windows, per-dimension thresholds).
DO NOT PUBLISH. For public version, strip all quantitative parameters and algorithmic details.
See docs/.core/security-parameters-v0.1.md for boundary definitions.
-->

# Presence Challenge Protocol — Formal Specification v0.1

## The Cryptographic Challenge Layer for Motion-Native Identity Verification

**Status**: Technical Specification — Target: Cryptography / Protocol Engineering  
**Depends on**: Presence Protocol Whitepaper v0.1 §3 (Threat Model), §4 (Challenge Protocol)  
**Paired with**: Motion Signature Formalization v0.1  
**Feeds into**: Whitepaper §4, Multi-Factor Framework §6, SDK Specification  

---

## 0. Preliminaries

### 0.1 The Challenge-Response Paradigm

The Presence Challenge Protocol (PCP) is an **active challenge-response protocol** — the verifier issues an unpredictable motion instruction, and the prover (human) must execute it within strict temporal and kinematic constraints.

This is fundamentally different from passive biometric recognition:

| | Passive Recognition | Active Challenge-Response |
|:---|:---|:---|
| Attack surface | Fixed — attacker can pre-compute | Dynamic — each challenge is fresh |
| AI advantage | High — offline generation possible | Low — real-time constraint collapses AI advantage |
| Replay risk | High — recording can be replayed | Zero — challenge includes cryptographic nonce |
| Information leakage | Each verification leaks the same signal | Each challenge samples a different subspace |

### 0.2 Protocol Roles

| Role | Notation | Description |
|:---|:---|:---|
| **Verifier** | $\mathcal{V}$ | Trusted entity that generates challenges and validates responses |
| **Prover** | $\mathcal{P}$ | Human whose presence is being verified |
| **Device** | $\mathcal{D}$ | Hardware platform executing capture and local proof generation |
| **Attacker** | $\mathcal{A}$ | Any entity attempting to produce a valid response without $\mathcal{P}$'s physical presence |

### 0.3 Cryptographic Primitives

| Primitive | Symbol | Requirements |
|:---|:---|:---|
| CSPRNG | $\text{Gen}$ | 256-bit security, NIST SP 800-90A compliant |
| Keyed Hash (HMAC) | $H_k$ | SHA-512/256 minimum |
| Session Key Exchange | $\text{KE}$ | X25519 or hybrid PQC |
| Timestamp | $\text{ts}$ | Monotonic, NTP-synchronized within ±100ms |
| Nonce | $n$ | 128-bit random, never reused per session |

### 0.4 Notation

| Symbol | Meaning |
|:---|:---|
| $\mathcal{C}$ | Challenge space — the set of all possible challenges |
| $\mathcal{A}_{\text{base}}$ | Base action library — finite set of atomic motion primitives |
| $\mathcal{P}_{\text{param}}$ | Parameter space — continuous ranges for each action parameter |
| $\mathcal{R}$ | Response space — the set of all possible motion responses |
| $c \in \mathcal{C}$ | A specific challenge |
| $r \in \mathcal{R}$ | A specific response (raw motion data from the device) |
| $\text{MS}(r)$ | Motion Signature of response $r$ |
| $\text{score}(c, r, \mathbf{z}_{\text{enroll}})$ | Verification score |

---

## 1. Challenge Space Definition

### 1.1 Formal Structure

A challenge $c \in \mathcal{C}$ is a tuple:

$$c = (\mathbf{a}, \mathbf{p}, \mathbf{q}, t_{\text{window}}, n)$$

where:

| Component | Symbol | Type | Description |
|:---|:---|:---|:---|
| Action vector | $\mathbf{a} = (a_1, \ldots, a_k)$ | $\mathcal{A}_{\text{base}}^k$ | $k$ atomic actions, $k \in [2, 5]$ |
| Parameter vector | $\mathbf{p} = (p_1, \ldots, p_k)$ | $\mathcal{P}_{\text{param}}^k$ | Parameters for each action |
| Constraints | $\mathbf{q} = (q_1, \ldots, q_m)$ | $\mathcal{Q}^m$ | $m$ coupling/temporal/posture constraints, $m \in [3, 8]$ |
| Time window | $t_{\text{window}}$ | $\mathbb{R}^+$ | Maximum response duration (default: 4.0s) |
| Nonce | $n$ | $\{0,1\}^{128}$ | Cryptographic nonce binding challenge to session |

### 1.2 Base Action Library $\mathcal{A}_{\text{base}}$

The action library is organized by **joint group** and **trajectory class**:

**Joint Groups**:
| Group ID | Joints | Examples |
|:---|:---|:---|
| RA | Right arm (shoulder, elbow, wrist) | Draw, point, wave |
| LA | Left arm | Draw, point, wave |
| RH | Right hand (wrist, fingers) | Touch, pinch, tap |
| LH | Left hand | Touch, pinch, tap |
| TR | Torso (spine, pelvis, chest) | Lean, twist, bend |
| HD | Head (neck) | Turn, tilt, nod |
| RL | Right leg (hip, knee, ankle) | Lift, step |
| LL | Left leg | Lift, step |

**Trajectory Classes**:
| Class | Symbol | Description | Non-Periodicity |
|:---|:---|:---|:---|
| Circular | CIRC | Circular motion (CW/CCW) | Periodic |
| Polygonal | POLY | N-sided polygon trajectory | Non-periodic (corners) |
| Linear | LIN | Straight line in 3D | Non-periodic |
| Sinusoidal | SIN | Wave trajectory | Periodic |
| Asymmetric shape | ASYM | Irregular shape (e.g., "house shape") | Non-periodic |
| Point-to-point | P2P | Touch two specific body locations | Non-periodic |

**Total base action cardinality**: $|\mathcal{A}_{\text{base}}| \approx 50$ (8 joint groups × ~6 trajectory classes, minus infeasible combinations).

### 1.3 Parameter Space $\mathcal{P}_{\text{param}}$

Each action $a$ is parameterized by:

| Parameter | Symbol | Range | Granularity |
|:---|:---|:---|:---|
| Direction / orientation | $\theta$ | $[0, 2\pi)$ or $\{\text{CW}, \text{CCW}\}$ | Continuous |
| Amplitude | $A$ | $[5\text{cm}, 50\text{cm}]$ | Continuous |
| Speed | $v$ | $[0.1, 2.0]\text{ m/s}$ | Continuous |
| Duration | $\Delta t$ | $[0.5, 3.0]\text{ s}$ | Continuous |
| Starting point | $\mathbf{x}_0$ | Body-relative coordinate | Continuous |

The parameter space is continuous → **uncountably infinite** → impossible to enumerate.

### 1.4 Constraint Space $\mathcal{Q}$

Constraints are the **security-critical** component. They introduce coupling that prevents independent generation and fusion.

**Constraint Types**:

| Type | Symbol | Description | Security Role |
|:---|:---|:---|:---|
| **Kinetic chain coupling** | $Q_{\text{chain}}$ | Two actions share a body segment → cannot be independently generated | **Prevents parallel generation + fusion** |
| **Posture constraint** | $Q_{\text{posture}}$ | Specific body alignment required (e.g., "torso upright," "head level") | Forces full-body consistency |
| **Timing constraint** | $Q_{\text{time}}$ | Temporal relationship between actions (e.g., "pause 0.5s between," "simultaneous start") | Adds temporal dimension to verification |
| **Velocity constraint** | $Q_{\text{vel}}$ | Required speed profile (e.g., "slow," "explosive") | Modulates kinematic features |
| **Asymmetry constraint** | $Q_{\text{asym}}$ | Explicit left-right asymmetry requirement | Exploits AI symmetry bias |
| **Contact constraint** | $Q_{\text{contact}}$ | Specific body contact required (e.g., "touch nose") | Introduces tactile feedback loop |

**Definition 1.4.1 (Valid Challenge)**. A challenge $c$ is *valid* iff:
1. $k \geq 2$ (multi-action)
2. At least one $q \in \mathbf{q}$ is of type $Q_{\text{chain}}$ (coupling constraint — Patch 1)
3. At least two distinct joint groups are involved
4. At least one action has non-periodic trajectory class
5. $t_{\text{window}} \in [3.0, 5.0]$ seconds
6. No action is physically impossible for the specified joint group

### 1.5 Challenge Entropy

**Definition 1.5.1 (Challenge Entropy)**. The entropy of the challenge distribution is:

$$H(\mathcal{C}) = \log_2|\mathcal{C}_{\text{valid}}|$$

where $\mathcal{C}_{\text{valid}} \subset \mathcal{C}$ is the set of all valid challenges.

**Lower bound estimate**:

| Component | Contribution | Computation |
|:---|:---|:---|
| Action selection ($k=3$) | $\log_2\binom{50}{3}$ | ~16 bits |
| Action ordering | $\log_2(3!)$ | ~3 bits |
| Continuous parameters (×5 per action, ×3 actions) | Effectively infinite | ~$\infty$ (discretized: ~48 bits at 8-bit quantization) |
| Constraint selection ($m=4$ from ~20 constraint types) | $\log_2\binom{20}{4}$ | ~10 bits |
| Constraint parameters | Continuous | ~16 bits (discretized) |
| **Total (discretized)** | | **~93 bits** |

$$H(\mathcal{C}) \approx 2^{93} \approx 10^{28}$$

This is far beyond enumeration. The continuous parameters make the true entropy unbounded.

---

## 2. Challenge Generation Algorithm

### 2.1 Algorithm Specification

```
Algorithm: GenerateChallenge(session_key, user_device_tier, risk_level)

Input:
  session_key  : Established via KE — binds challenge to session
  device_tier  : 1 (basic), 2 (TEE+IMU), 3 (TEE+IMU+secure boot)
  risk_level   : 0.0 (minimal) to 1.0 (maximum) — derived from operation value + RecentRiskLoad

Output:
  c = (a, p, q, t_window, n)
  challenge_token = HMAC(session_key, c)

Steps:
  1. n ← CSPRNG(128)                          // Fresh nonce
  2. k ← 2 + ⌊risk_level × 3⌋                 // 2–5 actions based on risk
  3. joint_groups ← SelectRandom(available_groups, k)
     CONSTRAINT: at least 2 distinct groups
  4. trajectory_classes ← SelectRandom(available_classes, k)
     CONSTRAINT: at least 1 non-periodic class
  5. FOR i = 1 TO k:
       a[i] ← (joint_groups[i], trajectory_classes[i])
       p[i] ← (θ, A, v, Δt, x₀) ∼ Uniform(parameter_space)
  6. m ← 3 + ⌊risk_level × 5⌋                 // 3–8 constraints based on risk
  7. q ← SelectConstraints(m, coupling_required=true)
     MUST include: at least 1 Q_chain
     SHOULD include: Q_time, Q_vel
  8. t_window ← SampleWindow(risk_level)
     risk_level < 0.3 → 5.0s
     risk_level < 0.7 → 4.0s
     risk_level ≥ 0.7 → 3.0s
  9. c ← (a, p, q, t_window, n)
  10. challenge_token ← HMAC-SHA512(session_key, Serialize(c))
  11. RETURN (c, challenge_token)
```

### 2.2 Coupling Constraint Selection (Patch 1 — Formalized)

**Algorithm: SelectCouplingConstraint**

```
Input:
  a = (a₁, ..., a_k)    // selected actions with their joint groups

Output:
  q_chain                 // a coupling constraint binding two or more actions

Steps:
  1. Identify all shared body segments across selected joint groups:
     shared_segments ← ∅
     FOR each pair (aᵢ, aⱼ):
       IF joint_groups(aᵢ) ∩ joint_groups(aⱼ) ≠ ∅:
         shared_segments ← shared_segments ∪ (aᵢ, aⱼ, shared_joints)
  
  2. IF shared_segments is empty:
     // No natural coupling — add a posture constraint on the shared kinetic chain
     q_chain ← CreatePostureCoupling(a₁, a₂, "maintain torso angle")
     // This forces the torso to be a shared reference frame for both actions
   
  3. ELSE:
     // Pick the strongest available coupling
     (aᵢ, aⱼ, shared) ← SelectRandom(shared_segments)
     q_chain ← {
       type: Q_chain,
       actions: [i, j],
       shared_segment: shared,
       constraint: "actions share kinetic chain through <shared>, 
                    independent generation detectable via torque inconsistency"
     }
  
  4. RETURN q_chain
```

**Why this defeats parallel generation**:

If an attacker independently generates "right hand circle" and "torso lean right," then fuses them via skeletal blending, the resulting motion will exhibit:
- **Torque inconsistency**: the torso lean generates reactive torque on the shoulder joint that must propagate into the arm trajectory. Independently generated arm motion will lack this reactive component.
- **Timing mismatch**: the torso lean's acceleration profile should temporally correlate with the arm's compensatory adjustment. Independent generation destroys this correlation.
- **Coordination matrix anomaly**: the cross-correlation $\rho_{\text{torso}, \text{right\_shoulder}}(\tau)$ will deviate from the human baseline.

### 2.3 Time Window Determination

The time window is a critical security parameter. It bounds the AI's real-time generation window:

| Risk Level | Window | Rationale |
|:---|:---|:---|
| <0.3 | 5.0s | Low-value ops — longer window for usability |
| 0.3–0.7 | 4.0s | Medium-value ops |
| ≥0.7 | 3.0s | High-value ops — stricter real-time constraint |

The timer starts when the challenge is displayed to the user and stops when the device begins streaming response data. **The window is not the action execution time — it is the total allowed latency from challenge display to response initiation.**

**Definition 2.3.1 (Response Latency)**. 

$$t_{\text{latency}} = t_{\text{response\_start}} - t_{\text{challenge\_display}}$$

Protocol requirement: $t_{\text{latency}} \leq 100\text{ms}$.

This 100ms bound is below the current (2026) and projected near-future (2028) real-time motion generation latency of AI models (500ms–2s currently, 200–500ms projected for 2028). Even at the most optimistic AI progress, sub-100ms high-fidelity motion generation requires fundamental architectural breakthroughs.

---

## 3. Response Collection

### 3.1 Data Stream Specification

During the challenge window $[t_0, t_0 + t_{\text{window}}]$, the device $\mathcal{D}$ collects:

| Stream | Source | Rate | Format |
|:---|:---|:---|:---|
| Camera frames | RGB camera | 30–60 fps | YUV420 / raw |
| 3D keypoints | MediaPipe / device-native pose estimator | 30–60 fps | $N \times 3$ float32 |
| IMU accelerometer | Device IMU | 100–200 Hz | 3-axis, m/s² |
| IMU gyroscope | Device IMU | 100–200 Hz | 3-axis, rad/s |
| Device attestation | TEE / platform API | Once per session | Signed device state |

### 3.2 Local Processing Pipeline

All processing occurs on-device. Raw data never leaves the device.

```
Capture → Normalize → Extract Features → Compute MS → Generate ZKP → Submit
```

The only data transmitted:
- ZK-Presence Proof (ZKP)
- Presence Entropy Score (PES)
- Timestamp
- Device attestation token
- Challenge token (echoed back)

### 3.3 Challenge Echo Verification

The response MUST include the challenge token, proving:
1. The response is for this specific challenge (not a replay)
2. The response was generated after the challenge was issued (temporal ordering)
3. The response has not been modified in transit (HMAC integrity)

---

## 4. Verification Function

### 4.1 Core Verification Logic

```
Algorithm: Verify(c, response, z_enroll)

Input:
  c           : The challenge that was issued
  response    : Response packet from the device
  z_enroll    : Enrolled Motion Signature for the claimed user

Output:
  result      : {accepted: bool, score: float, evidence: [...]}

Steps:
  1. // Integrity checks
     IF NOT VerifyHMAC(c.session_key, response.challenge_token):
       RETURN {accepted: false, reason: "challenge_integrity_failed"}
     IF response.timestamp - c.timestamp > c.t_window + tolerance:
       RETURN {accepted: false, reason: "timeout"}
     IF response.timestamp - c.timestamp < min_latency:
       RETURN {accepted: false, reason: "suspicious_fast_response"}  // <50ms = likely automated
     
  2. // Nonce and replay check
     IF nonce_seen(response.nonce):
       RETURN {accepted: false, reason: "replay_detected"}
     Mark nonce as seen.
  
  3. // Device attestation
     device_score ← VerifyDeviceAttestation(response.device_token)
     IF device_score < min_device_score(risk_level):
       RETURN {accepted: false, reason: "device_untrusted"}
  
  4. // Motion Signature verification
     z_response ← response.motion_signature
     motion_score ← 1 - ||z_enroll - z_response||₂ / (||z_enroll||₂ + ||z_response||₂)
  
  5. // Individual dimension checks (defense-in-depth)
     dimension_checks ← []
     FOR each feature group Φ in {Φ_K, Φ_A, Φ_J, Φ_Jspec, Φ_T, Φ_C, Φ_S}:
       dim_score ← CompareFeatureGroup(Φ(response), Φ(enroll))
       dimension_checks.append({feature: Φ.name, score: dim_score, passed: dim_score ≥ τ_Φ})
  
  6. // Multi-factor composition
     PES ← response.entropy_score
     IF PES < PES_min:
       RETURN {accepted: false, reason: "entropy_too_low"}
  
     presence_score ← ComputePresenceScore(motion_score, device_score, PES, 
                                           context_score, temporal_score, copresence_score)
  
  7. // Final decision
     τ_effective ← ComputeThreshold(risk_level, RecentRiskLoad(t))
     accepted ← presence_score ≥ τ_effective
  
  8. RETURN {
     accepted: accepted,
     score: presence_score,
     motion_score: motion_score,
     device_score: device_score,
     entropy_score: PES,
     dimension_checks: dimension_checks,
     threshold: τ_effective
   }
```

### 4.2 Per-Dimension Thresholds

Each feature group has its own acceptance threshold, calibrated from enrollment data:

| Feature Group | Threshold $\tau_\Phi$ | Rationale |
|:---|:---|:---|
| $\Phi_K$ (Kinematics) | 0.75 | Skeletal ratios are stable; motion kinematics have natural variance |
| $\Phi_A$ (Acceleration) | 0.65 | Acceleration varies with effort/fatigue |
| $\Phi_J$ (Jerk) | 0.55 | Jerk is highly variable but individually characteristic |
| $\Phi_{J_{\text{spec}}}$ (Jerk Spectrum) | **0.80** | High threshold — this is the strongest AI discriminator |
| $\Phi_T$ (Tremor) | **0.80** | High threshold — physiological tremor is very stable |
| $\Phi_C$ (Coordination) | 0.65 | Coordination patterns have moderate variance |
| $\Phi_S$ (Sensor Consistency) | **0.90** | Very high threshold — physical consistency must be near-perfect |

### 4.3 Challenge-Specific Scoring

Not all dimensions are equally informative for all challenges. The scoring weights adapt:

$$w_i(c) = \text{Relevance}(\Phi_i, c)$$

For example:
- A challenge with tight velocity constraints: $w_J$ (jerk) increases
- A challenge with asymmetric bimanual actions: $w_C$ (coordination) increases
- A challenge with contact constraints (touch nose): $w_S$ (sensor consistency) increases — contact creates distinct IMU signatures

---

## 5. Security Analysis

### 5.1 Pre-computation Resistance

**Claim 5.1.1**. No adversary can pre-compute a valid response before the challenge is issued.

*Proof sketch*: The challenge contains a 128-bit cryptographic nonce $n$ and is HMAC-bound to the session key. The response must echo the challenge token. The challenge entropy $H(\mathcal{C}) > 2^{90}$, making pre-computation of all possible responses infeasible. The 100ms delivery-to-response window eliminates the possibility of computing a response after seeing the challenge (for current and near-future AI).

### 5.2 Replay Resistance

**Claim 5.2.1**. No adversary can replay a previously valid response.

*Proof sketch*: Each challenge carries a unique nonce $n$. The verifier maintains a nonce-seen set (bounded by time window). The response is bound to the challenge via HMAC. A replayed response would either (a) carry a stale nonce → rejected, or (b) carry a non-matching HMAC → rejected.

### 5.3 Man-in-the-Middle Resistance

**Claim 5.3.1**. No network adversary can modify a response in transit.

*Proof sketch*: The response carries a device attestation token signed by the TEE. Tampering with the response invalidates the signature. The challenge token is HMAC-bound to the session key, which the network adversary does not possess.

### 5.4 AI Real-Time Generation Resistance

**Claim 5.4.1**. No AI model with inference latency $>100\text{ms}$ can generate a passing response within the protocol time window.

This is the core security claim. It rests on:
1. Current AI motion generation latency: 500ms–2s (2026)
2. Projected AI latency: 200–500ms (2028, optimistic)
3. Protocol latency bound: 100ms
4. The latency gap is not a temporary AI limitation — it's a consequence of the computational depth required for high-fidelity, identity-preserving motion generation. Reducing latency requires either:
   - Smaller models (→ lower fidelity → detectable by MS)
   - Specialized hardware (→ increases attacker infrastructure cost)
   - Model distillation (→ loss of identity-specific details)

### 5.5 Coupling Bypass Resistance (Patch 1 — Security Proof)

**Claim 5.5.1**. Any response generated by independent sub-action generation followed by skeletal fusion will be detected by the coordination feature $\Phi_C$ and/or the sensor consistency feature $\Phi_S$.

*Rationale*: Independent generation produces statistically independent sub-actions. Real human motion, even when performing multiple distinct actions, exhibits cross-action correlations driven by the shared kinetic chain. The coordination matrix $\mathbf{C}$ will show near-zero cross-correlation between independently generated action groups, whereas human motion shows significant off-diagonal structure. Furthermore, if the coupling constraint $Q_{\text{chain}}$ involves a postural element (e.g., torso lean), the IMU will record the torso's acceleration — and this must be physically consistent with the camera-derived kinematics. Independent generation cannot achieve this consistency without simulating the full-body physics, which is equivalent to solving the original problem (real-time, identity-preserving, physics-consistent full-body motion generation).

---

## 6. Implementation Considerations

### 6.1 Challenge Rendering

The challenge must be rendered to the user in a form they can quickly understand and execute. This requires:

1. **Visual rendering**: Animated stick figure or silhouette demonstrating the required motion, displayed on the device screen
2. **Text annotation**: Concise instruction in the user's language
3. **Countdown indicator**: Visual timer showing the remaining response window
4. **Spatial reference**: Overlay indicating the camera's field of view

The rendering must be pre-computed (from the challenge parameters) in <50ms to leave the full 100ms for the user's reaction.

### 6.2 Accessibility

The protocol must support users with:
- **Limited mobility**: Lower-complexity challenges (fewer joints, smaller amplitudes) mapped to lower risk tiers
- **Tremor disorders**: Alternative emphasis on coordination and kinematics over tremor features
- **Prosthetic limbs**: Enrollment with the prosthetic; the signature adapts

Accessibility accommodations are implemented as **challenge space restrictions**, not verification threshold reductions — the security boundary remains intact.

### 6.3 User Experience Loop

```
Challenge Display → User Execution → Real-time Feedback → Completion → Result

Real-time feedback:
  - Green overlay: motion quality is good, continue
  - Yellow overlay: borderline, adjust speed/amplitude
  - Red overlay: insufficient quality, please retry
```

The feedback must NOT reveal which specific dimensions are failing (prevents gradient leakage to attackers).

---

## 7. Open Problems

### 7.1 Minimum Challenge Complexity

What is the minimum challenge complexity that still provides meaningful security? This requires empirical calibration: at what complexity level does AI generation success rate drop below the false reject rate for humans?

### 7.2 Challenge Fatigue

Users performing dozens of challenges per day may experience fatigue, reducing motion quality. The protocol must model fatigue as a function of challenge count and adapt thresholds accordingly — while ensuring this adaptation cannot be exploited by attackers simulating fatigue.

### 7.3 Adversarial Challenge Optimization

An attacker with knowledge of the challenge generation algorithm might identify "easier" challenge subspaces. The challenge generator must be periodically re-seeded and its distribution audited for uniformity.

### 7.4 Cross-Device Calibration

Different devices have different camera qualities, IMU noise floors, and pose estimation accuracy. The Motion Signature must be calibrated per device model, with cross-device enrollment.

---

## 8. Summary

The Presence Challenge Protocol is an **active, unpredictable, multi-constraint challenge-response system** that:

1. Generates challenges from a space of $>2^{90}$ possible instances, making pre-computation infeasible
2. Imposes a 100ms real-time constraint below AI generation latency
3. Requires at least one kinetic chain coupling constraint per challenge to prevent parallel generation + fusion attacks
4. Collects multi-modal sensor data (camera + IMU) with mandatory cross-sensor consistency
5. Verifies responses across seven feature dimensions with dimension-specific thresholds
6. Integrates with the Multi-Factor Verification framework for defense-in-depth

The challenge is the **active ingredient** that transforms motion from a passive biometric (vulnerable to AI forgery) into a real-time presence signal (resistant to AI forgery). The Motion Signature (§5) provides the measurement apparatus. Together they form the protocol's core engine.

---

*This specification is v0.1. It will be refined as experimental data (E1–E5) provides empirical grounding for the theoretical claims herein.*
