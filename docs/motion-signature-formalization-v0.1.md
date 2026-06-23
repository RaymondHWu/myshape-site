<!--
🔴 INTERNAL COMPLETE VERSION — v0.1
This document contains core security parameters (FRI values, frequency bands, thresholds, feature rankings).
DO NOT PUBLISH. For public version, strip all quantitative parameters and relative feature strength comparisons.
See docs/.core/security-parameters-v0.1.md for boundary definitions.
-->

# Motion Signature Formalization v0.1

## A Cryptographic Treatment of Human Motion as an Unforgeable Signal

**Status**: Technical Specification — Target: Cryptography / Security Community  
**Depends on**: Presence Protocol Whitepaper v0.1 §3 (Threat Model), §4 (Challenge Protocol)  
**Feeds into**: Whitepaper §5, Multi-Factor Framework §6, E3 Experiment Design  

---

## 0. Preliminaries

### 0.1 Notation

| Symbol | Meaning |
|:---|:---|
| $\mathbb{R}$ | Real numbers |
| $\mathbb{R}^d$ | d-dimensional real vector space |
| $\mathcal{K}$ | Keypoint space — $\mathbb{R}^{N \times 3}$ for $N$ keypoints |
| $\mathcal{T}$ | Time domain — $[0, T]$ for fixed window $T$ |
| $\mathcal{M}$ | Motion space — all functions $K: \mathcal{T} \to \mathcal{K}$ |
| $\mathcal{H} \subset \mathcal{M}$ | Human motion subspace — motions producible by a living human body |
| $\mathcal{A} \subset \mathcal{M}$ | AI motion subspace — motions generatable by any AI model |
| $\text{MS}: \mathcal{M} \to \mathbb{R}^d$ | Motion Signature function |
| $d(\cdot, \cdot)$ | Distance metric in signature space |
| $\tau$ | Verification threshold |

### 0.2 Core Definitions

**Definition 0.1 (Human Motion)**. A motion $m \in \mathcal{M}$ is *human* if and only if there exists a living human body $B$ such that $m$ is the output of $B$'s sensorimotor system executing a specified action within the challenge window.

**Definition 0.2 (AI Motion)**. A motion $\hat{m} \in \mathcal{M}$ is *AI-generated* if and only if it is produced by any computational model $\mathcal{A}$, including but not limited to: diffusion models, transformers, GANs, neural ODEs, physics simulators, or any future architecture — provided $\mathcal{A}$ has no direct access to the target human body $B$.

**Definition 0.3 (Motion Signature)**. A function $\text{MS}: \mathcal{M} \to \mathbb{R}^d$ is a *motion signature* if it satisfies:

1. **Uniqueness**: $\forall h_1, h_2 \in \mathcal{H}$ from different individuals,
   $$\mathbb{E}[d(\text{MS}(h_1), \text{MS}(h_2))] \gg \mathbb{E}[d(\text{MS}(h), \text{MS}(h'))]$$
   where $h, h'$ are from the same individual.

2. **Stability**: $\forall h, h' \in \mathcal{H}$ from the same individual,
   $$\mathbb{E}[d(\text{MS}(h), \text{MS}(h'))] \leq \delta_{\text{intra}}$$
   for some small $\delta_{\text{intra}}$.

3. **Forgery Resistance**: $\forall \hat{m} \in \mathcal{A}$ targeting individual $i$,
   $$\mathbb{E}[d(\text{MS}(\hat{m}), \text{MS}(h_i))] \geq \delta_{\text{forgery}}$$
   where $\delta_{\text{forgery}} \gg \delta_{\text{intra}}$.

4. **One-wayness**: Given $\text{MS}(m)$, it is computationally infeasible to reconstruct any $m'$ such that
   $d(\text{MS}(m'), \text{MS}(m)) < \tau$.

### 0.3 The Fundamental Assumption

> **Assumption 0.1 (Entropy Gap)**. There exists a non-empty set of signal dimensions $D^* \subset \{1, \ldots, d\}$ such that for all AI models $\mathcal{A}$ and all human bodies $B$:
>
> $$\min_{\hat{m} \in \mathcal{A}} \|\text{MS}(\hat{m})_{D^*} - \text{MS}(h)_{D^*}\| > 0$$
>
> The gap exists because these dimensions are driven by biological processes (neural noise, muscle micro-perturbation, physiological tremor) that are:
> - Non-inferrable from observable data alone
> - Non-reproducible by computational processes lacking a biological substrate
> - Statistically stable within an individual over time

This assumption is the *scientific hypothesis* that E3 (AI Forgery Limit Experiment) must validate. The rest of this document formalizes its consequences and operationalization.

---

## 1. Feature Dimensions

### 1.1 Overview

The Motion Signature $\text{MS}(m)$ is the concatenation of seven feature groups, each mapping from raw motion to a structured vector space:

$$\text{MS}(m) = \big[ \Phi_K(m) \;\|\; \Phi_A(m) \;\|\; \Phi_J(m) \;\|\; \Phi_T(m) \;\|\; \Phi_{J_{\text{spec}}}(m) \;\|\; \Phi_C(m) \;\|\; \Phi_S(m) \big]$$

where $\|$ denotes vector concatenation and each $\Phi_*$ is a feature extractor defined below.

### 1.2 Kinematic Features $\Phi_K$

**Input**: 3D keypoint sequence $K(t) \in \mathbb{R}^{N \times 3}$ for $t \in [0, T]$.

**Definition 1.2.1 (Skeletal Ratio Vector)**. For each pair of connected keypoints $(i,j)$ in the skeleton topology, compute:

$$r_{ij} = \frac{\|p_i - p_j\|}{\|p_{\text{ref1}} - p_{\text{ref2}}\|}$$

where $(p_{\text{ref1}}, p_{\text{ref2}})$ is a fixed reference segment (e.g., spine length). The skeletal ratio vector is:

$$\mathbf{r} = \{r_{ij}\}_{(i,j) \in \text{bones}} \in \mathbb{R}^{B}$$

where $B$ is the number of bone segments.

**Property 1.2.1 (Static Uniqueness)**. Skeletal ratios are determined by bone lengths, which are fixed for an adult human and unique at the millimeter scale. AI generators cannot infer true 3D bone lengths from 2D observations without depth ambiguity.

**Definition 1.2.2 (Joint Angle Sequence)**. For each joint $j$ with connected bones $b_1, b_2$:

$$\theta_j(t) = \arccos\left(\frac{\mathbf{v}_{b_1}(t) \cdot \mathbf{v}_{b_2}(t)}{\|\mathbf{v}_{b_1}(t)\| \|\mathbf{v}_{b_2}(t)\|}\right)$$

$$\Phi_K(m) = \text{PCA}_{128}\big(\{\theta_j(t)\}_{j \in \text{joints}, t \in [0,T]}\big)$$

where PCA reduces the joint angle time series to a 128-dimensional representation capturing the principal modes of angular variation.

### 1.3 Acceleration Features $\Phi_A$

**Definition 1.3.1 (Keypoint Acceleration)**. For each keypoint $i$:

$$A_i(t) = \frac{d^2 K_i(t)}{dt^2} \in \mathbb{R}^3$$

**Definition 1.3.2 (Acceleration Profile)**. The acceleration profile captures the distributional properties:

$$\Phi_A(m) = \big[ \mu_A \;\|\; \sigma_A \;\|\; \gamma_A \;\|\; \kappa_A \;\|\; H_A \big] \in \mathbb{R}^{5N}$$

where for each keypoint:
- $\mu_A$: mean acceleration magnitude
- $\sigma_A$: standard deviation
- $\gamma_A$: skewness (asymmetry of acceleration distribution)
- $\kappa_A$: excess kurtosis (tail heaviness — captures "burstiness")
- $H_A$: Hurst exponent (long-range dependence, $0 < H < 1$)

**Property 1.3.1 (Human vs. AI Acceleration)**. Human acceleration exhibits $H_A \approx 0.6\text{--}0.8$ (persistent, long-memory process). AI-generated acceleration exhibits $H_A \approx 0.5$ (white noise after smoothing) or $H_A \approx 0.3\text{--}0.4$ (anti-persistent, over-regularized).

### 1.4 Jerk Features $\Phi_J$

**Definition 1.4.1 (Jerk)**. The jerk is the third temporal derivative of position:

$$J_i(t) = \frac{dA_i(t)}{dt} = \frac{d^3 K_i(t)}{dt^3}$$

**Definition 1.4.2 (Jerk Profile)**. 

$$\Phi_J(m) = \big[ \mu_J \;\|\; \sigma_J \;\|\; \gamma_J \;\|\; \text{MAD}_J \;\|\; \rho_J \big] \in \mathbb{R}^{5N}$$

where:
- $\text{MAD}_J$: median absolute deviation (robust to outliers)
- $\rho_J$: lag-1 autocorrelation of jerk magnitude

**Theorem 1.4.1 (Jerk Discontinuity Gap — Informal)**. Let $J_{\text{human}}$ be the jerk of a human motion and $J_{\text{AI}}$ be the jerk of an AI-generated motion targeting the same action. Then:

$$\text{TV}(J_{\text{human}}) > \text{TV}(J_{\text{AI}})$$

where $\text{TV}(f) = \int |f'(t)| dt$ is the total variation.

*Rationale*: Human jerk contains high-frequency components from physiological tremor and neural noise that AI models smooth away due to: (a) $L_2$ loss penalizing high-frequency content, (b) implicit smoothness bias in neural architectures, (c) absence of biological noise sources in the generation process.

### 1.5 Jerk Spectrum Features $\Phi_{J_{\text{spec}}}$

**Definition 1.5.1 (Jerk Spectrum)**. For each keypoint $i$, compute the short-time Fourier transform of the jerk magnitude:

$$J_{\text{spec},i}(f, t) = \left| \int_{t-\Delta}^{t+\Delta} \|J_i(\tau)\| \cdot w(\tau - t) \cdot e^{-j2\pi f \tau} d\tau \right|$$

where $w$ is a Hamming window of width $2\Delta = 0.5\text{s}$.

**Definition 1.5.2 (Spectral Feature Vector)**. Aggregate across keypoints and time:

$$\Phi_{J_{\text{spec}}}(m) = \big[ E_{1\text{-}3\text{Hz}} \;\|\; E_{3\text{-}8\text{Hz}} \;\|\; E_{8\text{-}15\text{Hz}} \;\|\; E_{15\text{-}30\text{Hz}} \;\|\; \alpha_{\text{slope}} \;\|\; S_{\text{entropy}} \big] \in \mathbb{R}^{6N}$$

where:
- $E_{[a,b]}$: energy in frequency band $[a, b]$ Hz
- $\alpha_{\text{slope}}$: spectral slope (log-log fit of power vs. frequency) — captures $1/f^\alpha$ scaling
- $S_{\text{entropy}}$: spectral entropy $-\int p(f) \log p(f) df$

**Property 1.5.1 (Human Jerk Spectrum)**. Human jerk magnitude follows approximate $1/f^\alpha$ scaling with $\alpha \approx 1.0\text{--}1.5$ in the 1–15 Hz band, reflecting the multi-scale nature of biological control systems (motor units of varying size, neural conduction delays, feedback loops at multiple timescales).

**Property 1.5.2 (AI Jerk Spectrum)**. AI-generated jerk exhibits one of two failure modes:
1. **Over-smoothing**: $\alpha > 2.0$ — excessive attenuation of high frequencies, power concentrated below 3 Hz.
2. **Unstructured noise**: $\alpha \approx 0$ (flat spectrum) — when the model adds random jitter to simulate "naturalness," producing spectrally white rather than $1/f$ noise.

**Conjecture 1.5.1 (Jerk Spectrum Separability)**. The feature vector $\Phi_{J_{\text{spec}}}$ is the most discriminative single feature group for human vs. AI motion, with expected AUC > 0.95 even under the most pessimistic AI assumptions (T₂ / 2030).

### 1.6 Tremor Spectrum Features $\Phi_T$

**Definition 1.6.1 (Position Tremor Spectrum)**. For each keypoint $i$, compute the power spectral density of the detrended position:

$$T_i(f) = |\mathcal{F}\{K_i(t) - \bar{K}_i(t)\}|^2$$

where $\bar{K}_i(t)$ is the low-frequency trend (below 2 Hz, capturing the voluntary motion) removed via high-pass filter.

**Definition 1.6.2 (Tremor Feature Vector)**.

$$\Phi_T(m) = \big[ P_{8\text{-}12\text{Hz}} \;\|\; Q_{8\text{-}12\text{Hz}} \;\|\; f_{\text{peak}} \;\|\; \sigma_f \big] \in \mathbb{R}^{4N}$$

where:
- $P_{8\text{-}12\text{Hz}}$: total power in physiological tremor band
- $Q_{8\text{-}12\text{Hz}}$: spectral flatness in tremor band (ratio of geometric to arithmetic mean)
- $f_{\text{peak}}$: peak frequency in 8–12 Hz band (individual-specific, stable across sessions)
- $\sigma_f$: bandwidth of the tremor peak

**Property 1.6.1 (Tremor Individuality)**. The peak frequency $f_{\text{peak}}$ in the 8–12 Hz band is individually stable (test-retest correlation $r > 0.85$ within individual, $r < 0.3$ across individuals). This is a direct consequence of individual differences in:
- Muscle spindle density and distribution
- Motor unit recruitment patterns
- Corticospinal tract conduction velocity
- Limb mechanical resonance properties (determined by bone length + muscle mass)

**Property 1.6.2 (AI Absence of Tremor)**. AI models, including those trained on human motion data, do not naturally produce 8–12 Hz tremor because:
1. The tremor is not encoded in training data at sufficient resolution (most pose estimation models operate at 30 fps, barely above the Nyquist frequency for 12 Hz)
2. The tremor is a *byproduct* of the biological control system, not a *feature* of the motion trajectory — even if the model learns to reproduce the trajectory, it does not reproduce the control system that generates the tremor
3. Adding artificial tremor post-hoc produces spectrally incorrect noise (white or pink, not the narrow-band 8–12 Hz peak characteristic of physiological tremor)

### 1.7 Coordination Features $\Phi_C$

**Definition 1.7.1 (Joint Pair Correlation)**. For each pair of joints $(i, j)$:

$$\rho_{ij}(\tau) = \frac{\mathbb{E}[(K_i(t) - \mu_i)(K_j(t+\tau) - \mu_j)]}{\sigma_i \sigma_j}$$

**Definition 1.7.2 (Coordination Matrix)**. The coordination matrix at lag $\tau = 0$:

$$\mathbf{C} = [\rho_{ij}(0)]_{i,j=1}^{N} \in \mathbb{R}^{N \times N}$$

**Definition 1.7.3 (Coordination Feature Vector)**.

$$\Phi_C(m) = \big[ \text{vec}(\mathbf{C}_{\text{upper}}) \;\|\; \lambda_1, \ldots, \lambda_k \;\|\; \phi_{\text{sym}} \big]$$

where:
- $\mathbf{C}_{\text{upper}}$: upper triangular elements of the coordination matrix
- $\lambda_1, \ldots, \lambda_k$: top-k eigenvalues capturing the dominant coordination modes
- $\phi_{\text{sym}}$: symmetry index — difference between left-right coordination patterns

**Property 1.7.1 (AI Coordination Failure)**. AI-generated motions commonly exhibit:
- **Local coherence, global incoherence**: individual joint pairs have plausible correlations, but the eigenvalue spectrum is inconsistent with a real kinematic chain (rank-deficient coordination matrix or eigenvalues inconsistent with the number of independent motor synergies)
- **Excessive symmetry**: $\phi_{\text{sym}}$ too low — AI tends toward symmetrical coordination absent explicit asymmetry training
- **Missing kinetic chain signatures**: correlations between non-adjacent joints in the same kinetic chain (e.g., shoulder-to-wrist via elbow) show phase shifts inconsistent with torque propagation through the chain

### 1.8 Sensor Consistency Features $\Phi_S$

**Definition 1.8.1 (Camera-IMU Discrepancy)**. Let $A_{\text{cam}}(t)$ be the acceleration derived from camera keypoint trajectories (double differentiation of $K(t)$). Let $A_{\text{IMU}}(t)$ be the acceleration directly measured by the device's inertial measurement unit.

$$S(t) = \|A_{\text{cam}}(t) - A_{\text{IMU}}(t)\|_2$$

**Definition 1.8.2 (Sensor Consistency Feature Vector)**.

$$\Phi_S(m) = \big[ \mu_S \;\|\; \sigma_S \;\|\; \max(S) \;\|\; \text{corr}(A_{\text{cam}}, A_{\text{IMU}}) \;\|\; \rho_S \big] \in \mathbb{R}^5$$

where $\rho_S$ is the lag-1 autocorrelation of $S(t)$.

**Property 1.8.1 (Screen Forgery Detection)**. When an attacker displays AI-generated motion on a screen:
- $A_{\text{cam}}(t)$ reflects the generated motion
- $A_{\text{IMU}}(t)$ reflects the stationary (or handheld) device's true acceleration
- $S(t)$ exhibits high mean, high variance, and near-zero correlation between $A_{\text{cam}}$ and $A_{\text{IMU}}$
- For genuine human motion: $\mu_S$ is small (<0.1 m/s²), $\text{corr}(A_{\text{cam}}, A_{\text{IMU}}) > 0.7$

**Property 1.8.2 (Multi-Sensor Injection Difficulty)**. To simultaneously spoof camera and IMU with physically consistent signals, the attacker must either:
1. **Physically move an IMU-equipped device** in the target trajectory (B2b — requires physical robot, $200K+)
2. **Inject synchronized false data into both sensor drivers** (B3 Level 2+ — requires kernel-level access + multi-sensor synchronization, $50K-$200K+ engineering)
3. **Remotely control a compromised device's actuators** — not applicable to standard smartphones

---

## 2. Signature Composition

### 2.1 Dimensionality and Normalization

Each feature group produces a vector of known dimension:

| Feature Group | Symbol | Raw Dimension | After PCA/AE |
|:---|:---|:---|:---|
| Kinematics | $\Phi_K$ | 128 | 128 |
| Acceleration | $\Phi_A$ | 5N (165 for N=33) | 64 |
| Jerk | $\Phi_J$ | 5N (165) | 64 |
| Jerk Spectrum | $\Phi_{J_{\text{spec}}}$ | 6N (198) | 64 |
| Tremor Spectrum | $\Phi_T$ | 4N (132) | 64 |
| Coordination | $\Phi_C$ | (N²-N)/2 + k + 1 | 96 |
| Sensor Consistency | $\Phi_S$ | 5 | 5 |

Each group is independently normalized to zero mean and unit variance (parameters learned from enrollment data).

### 2.2 Concatenated Signature

The raw concatenated signature has dimension:

$$d_{\text{raw}} = 128 + 64 + 64 + 64 + 64 + 96 + 5 = 485$$

After applying a final whitening transform (PCA to 256 dimensions, learned from a diverse training population):

$$\mathbf{z} = W \cdot \text{MS}(m) \in \mathbb{R}^{256}$$

where $W$ is the whitening matrix.

### 2.3 Verification Score

Given an enrollment signature $\mathbf{z}_{\text{enroll}}$ and a challenge-response signature $\mathbf{z}_{\text{response}}$:

$$\text{score} = 1 - \frac{\|\mathbf{z}_{\text{enroll}} - \mathbf{z}_{\text{response}}\|_2}{\|\mathbf{z}_{\text{enroll}}\|_2 + \|\mathbf{z}_{\text{response}}\|_2}$$

This produces scores in $[0, 1]$, where 1 indicates perfect match and 0 indicates orthogonal signatures.

### 2.4 Enrollment

Enrollment requires $E$ motion samples from the same individual (recommended $E \geq 20$), covering diverse challenge types. The enrollment signature is the mean:

$$\mathbf{z}_{\text{enroll}} = \frac{1}{E} \sum_{e=1}^{E} \mathbf{z}_e$$

with intra-person variance estimated as:

$$\sigma^2_{\text{intra}} = \frac{1}{E-1} \sum_{e=1}^{E} \|\mathbf{z}_e - \mathbf{z}_{\text{enroll}}\|^2$$

---

## 3. Security Analysis

### 3.1 Threat Model (Recap from Whitepaper §3)

The attacker $\mathcal{A}$:
- Has access to a pretrained motion foundation model (2028+ capability)
- Possesses $D_{\text{train}}$ motion samples of the target (quality L1–L4)
- Can fine-tune the foundation model on target data
- Can perform real-time inference (latency $t_{\text{infer}}$)
- Has budget $B$

The defender (MyShape Protocol):
- Issues unpredictable challenge $c \sim \mathcal{C}$ (challenge distribution)
- Collects camera + IMU data during response window
- Computes $\mathbf{z}_{\text{response}}$ and compares with $\mathbf{z}_{\text{enroll}}$
- Accepts if $\text{score} \geq \tau$

### 3.2 Information-Theoretic Bound on Forgery Quality

**Theorem 3.2.1 (Information Limit of Motion Reconstruction)**. Let $D_{\text{train}}$ be the set of training data available to the attacker, with total Shannon information content $I(D_{\text{train}}; B)$ about the target body $B$. The attacker's optimal forgery $\hat{m}$ satisfies:

$$\mathbb{E}[\|\text{MS}(\hat{m}) - \text{MS}(h)\|] \geq f(I(D_{\text{train}}; B))$$

where $f$ is a monotonically decreasing function approaching zero only as $I \to \infty$.

*Sketch*: The Motion Signature extracts features from high-frequency, non-inferrable dimensions (tremor, jerk spectrum, sensor consistency). The mutual information between these dimensions and the training data is fundamentally limited by:
1. **Nyquist limit**: 2D video at 30 fps cannot capture >15 Hz dynamics — and tremor (8–12 Hz) requires >24 fps to resolve, meaning the phase information is aliased
2. **Depth ambiguity**: 2D→3D lifting is ill-posed; true skeletal proportions are underdetermined from 2D projections alone
3. **Sensor noise**: Even 3D pose data (L3) from consumer devices has measurement noise that masks micro-kinematic features at the millimeter scale needed for jerk and tremor extraction

The consequence: no finite training dataset can fully determine the target's Motion Signature. There is an irreducible gap.

### 3.3 Dimensional Contribution to Forgery Resistance

We assign each feature dimension a **Forgery Resistance Index** (FRI) based on:
- **Inferrability**: How much information about this dimension can be extracted from training data?
- **Generatability**: How well can an AI model reproduce this dimension even with perfect knowledge?
- **Verifiability**: How reliably can this dimension be measured during verification?

| Dimension | Inferrability | Generatability | Verifiability | **FRI** (1–10) |
|:---|:---|:---|:---|:---|
| Kinematics (ratios + angles) | Medium | Medium-High | High | 4 |
| Acceleration profile | Medium | Medium | High | 5 |
| Jerk profile | Low-Medium | Low | Medium-High | 7 |
| **Jerk spectrum** | **Very Low** | **Very Low** | **Medium-High** | **9** |
| Tremor spectrum | Very Low | Very Low | Medium | 8 |
| Coordination matrix | Medium | Low-Medium | High | 6 |
| Sensor consistency | Zero (physical) | Zero (physical) | High | **10** |

**Theorem 3.3.1 (FRI Composition)**. The overall forgery resistance of the composite signature is bounded below by the maximum FRI of any component, and above by a weighted combination:

$$\text{FRI}_{\text{total}} \geq \max_i \text{FRI}_i$$

$$\text{FRI}_{\text{total}} \leq \sum_i w_i \cdot \text{FRI}_i$$

In practice, the attacker must succeed on ALL dimensions to achieve a high verification score. The defense only needs ONE dimension with high FRI to create a detectable gap. This is a fundamental asymmetry favoring the defender.

### 3.4 Sensitivity Analysis

**Definition 3.4.1 (Feature Sensitivity to AI Forgery)**. For each feature dimension $d$, define the expected standardized difference:

$$\Delta_d = \frac{\mathbb{E}_{h \in \mathcal{H}}[\Phi_d(h)] - \mathbb{E}_{\hat{m} \in \mathcal{A}}[\Phi_d(\hat{m})]}{\sigma_d^{\text{human}}}$$

where $\sigma_d^{\text{human}}$ is the human population standard deviation on dimension $d$.

**Conjecture 3.4.1 (Expected Sensitivity Ordering)**.

$$\Delta_{J_{\text{spec}}} > \Delta_T > \Delta_S > \Delta_J > \Delta_C > \Delta_A > \Delta_K$$

The jerk spectrum, tremor, and sensor consistency dimensions are expected to show the largest standardized differences between human and AI motion — even under the most pessimistic AI assumptions.

---

## 4. Open Problems

### 4.1 Empirical Validation

All FRI estimates are theoretical. E3 (AI Forgery Limit Experiment) must provide empirical:
- $\Delta_d$ for each dimension across multiple AI model architectures
- ROC curves for human vs. AI classification per dimension and in combination
- Scaling laws: how does $\Delta_d$ change as a function of training data quantity and quality?

### 4.2 Adversarial Adaptation

An attacker aware of the Motion Signature function may explicitly optimize against it. This requires:
- **Gradient-based attacks**: If the attacker can approximate $\nabla_{\hat{m}} \text{MS}(\hat{m})$, they may optimize forgery quality. Defense: make MS non-differentiable through quantization + hashing.
- **Black-box attacks**: If the attacker can query the verifier, they may iteratively improve. Defense: rate limiting + query cost + temporal drift detection.

### 4.3 Population-Scale Uniqueness

The theoretical uniqueness of Motion Signatures (E1) must be validated at scale. Key question: what is the False Accept Rate (FAR) in a population of $10^6$? $10^9$? The signature dimensionality ($d=256$) provides an information-theoretic capacity of $\log_2(10^9) \approx 30$ bits — well within the capacity of a 256-dimensional real-valued vector, but dependent on the effective dimensionality of human motion variation.

### 4.4 Long-Term Stability

Over years, human motion changes (aging, injury, weight change, fitness). The enrollment must be updatable without compromising security. The stability envelope across years is unknown and must be characterized.

---

## 5. Summary

The Motion Signature function formalized in this document maps human motion to a 256-dimensional vector space with the following security properties:

1. **Seven complementary feature groups** spanning kinematics, dynamics, spectral properties, coordination structure, and physical sensor consistency
2. **Asymmetric defense**: the attacker must match all dimensions; the defender only needs a gap in one
3. **Fundamental information limits**: finite training data cannot fully determine the target signature due to Nyquist limits, depth ambiguity, and sensor noise floors
4. **Physical coupling**: sensor consistency (camera + IMU) provides a hard physical check that no software-only attack can satisfy
5. **Spectral depth**: jerk spectrum and tremor spectrum operate in frequency bands where AI generation is structurally deficient — a property of the AI architecture, not a temporary limitation

The Motion Signature is not claimed to be unforgeable in an absolute sense. It is claimed to be **economically unforgeable** when composed with the challenge protocol (§4) and multi-factor verification (§6) — the attacker's cost to achieve a passing score exceeds the value of the operation being protected.

---

*This formalization is v0.1. It will be updated as experimental data (E1–E5) becomes available, and as the AI threat landscape evolves.*
