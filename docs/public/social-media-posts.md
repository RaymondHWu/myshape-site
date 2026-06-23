# Social Media Launch Kit — "AI Cannot Forge Human Motion"

## X (Twitter) — Thread

**Tweet 1 (Hook)**
```
We built a Rust engine that detects AI-generated human motion.
GPT-5 and DeepSeek both failed.

Genuine human: 0.9817 ✅
AI forgery: 0.5857 ❌
Human—AI gap: 0.3960

The AI couldn't generate a human body's micro-tremor.
Here's why 🧵
```
🔗 Link to: https://www.myshape.com/blog

**Tweet 2 (The 4 rejection dimensions)**
```
The engine rejected AI motion across 4 independent dimensions:

• TREMOR_ABSENT — no 8-12 Hz stretch reflex
• JERK_SPECTRUM_ANOMALY — no 1/f scaling
• HURST_ANOMALY — acceleration is uncorrelated noise
• OVER_SMOOTHED — too perfect to be biological

AI doesn't look wrong. It looks too right.
```

**Tweet 3 (Why L2 loss guarantees detection)**
```
AI motion models use L2 loss. L2 penalizes the square of error.

A 1 mm tremor → penalized 100× less than a 10 mm trajectory error.

The model learns to suppress exactly the signals that make human motion human. This isn't a temporary limitation. It's structural.
```

**Tweet 4 (The AI Paradox — most shareable)**
```
The AI Paradox:

The better AI gets at generating realistic motion, the more aggressively it smooths, averages, and regularizes — and the MORE detectable it becomes.

Every improvement in visual fidelity comes at the cost of spectral fidelity.

AI can't do both.
```

**Tweet 5 (Run it yourself)**
```
Open source. 25 tests. Rust core.

git clone https://github.com/myshapeprotocol
cd cli
cargo run --release --bin myshape-demo -- --verbose

Live dashboard: myshape.com/developers
```

**Tweet 6 (CTA)**
```
We're building a presence verification protocol for the AI era.

Not "are you a human?" (World)
But "are you THIS human, right now?"

Read the whitepaper: myshape.com/whitepaper
Contact: protocol@myshape.com

DMs open for investors, researchers, and builders.
```

---

## Hacker News — "Show HN"

**Title**:
```
Show HN: We built an engine that detects AI-generated human motion (0.396 gap)
```

**URL**: https://www.myshape.com/blog

**First comment** (post immediately after submission):
```
We've been working on this for a while. The core idea: AI can forge faces, voices, 
fingerprints — every static credential. But motion is different. It's real-time, 
high-entropy, and driven by biological processes (stretch reflex, motor unit 
recruitment, neural noise) that AI models fundamentally cannot replicate.

We tested our engine against GPT-5-level motion generation and got a 0.3960 
Human—AI gap. The rejection happens across 4 dimensions — tremor, jerk spectrum, 
Hurst exponent, and micro-perturbations. All measurable, all structural (not 
temporary AI limitations).

The engine is open source (Rust, 25 tests, zero deps beyond std + crypto crates). 
You can run the demo yourself: cargo run --release --bin myshape-demo -- --verbose

Happy to answer questions about the math, the threat model, or the protocol design.
```

---

## Reddit — r/rust

**Title**:
```
[Project] We built a motion verification engine in Rust — detects AI-generated human movement
```

**Body**:
```
The engine extracts a 128-dim signature from raw 3D pose data across 4 feature 
groups: kinematics, acceleration, jerk, and jerk spectrum. All processing is 
on-device. The core is ~2000 lines of Rust with 25 unit tests.

Tech stack: nalgebra for linear algebra, rustfft for spectral analysis, 
rand_chacha for CSPRNG challenge generation, blake3 + sha2 for commitments.

Repo: github.com/myshapeprotocol
Demo: cargo run --release --bin myshape-demo -- --verbose

Would love feedback on the DSP pipeline and the FFT implementation.
```

---

## Reddit — r/MachineLearning

**Title**:
```
[R] Why L2 Loss Makes AI-Generated Motion Structurally Detectable
```

**Body**:
```
We ran an experiment testing whether current SOTA motion generation models 
can pass a multi-dimensional kinematic verification engine.

Result: 0.3960 Human—AI gap. The AI fails on 4 dimensions — all of which are 
structural consequences of L2 training loss rather than temporary model limitations.

Key finding: L2 loss creates a fundamental tradeoff between visual fidelity and 
spectral fidelity. The better the AI looks, the easier it is to detect via 
frequency-domain analysis of jerk and tremor.

Full writeup with reproducible benchmarks: myshape.com/blog
Open source engine: github.com/myshapeprotocol

Paper-like details in the whitepaper: myshape.com/whitepaper
```

---

## LinkedIn

**Post**:
```
We built a verification engine that can tell the difference between a living 
human body and AI-generated motion.

Genuine human: 0.9817 ✅
Best AI forgery: 0.5857 ❌

The 0.3960 gap exists because AI cannot replicate:
— Physiological tremor (8-12 Hz stretch reflex)
— Natural jerk dynamics (1/f spectral scaling)
— Long-range acceleration dependence (Hurst exponent)
— Muscle micro-perturbations

These are not temporary AI limitations. They are structural consequences of 
how neural networks model the physical world.

The engine is open source (Rust, MIT license). The whitepaper is public.

🔗 myshape.com/blog
🔗 myshape.com/whitepaper
📧 protocol@myshape.com
```

---

## Posting Strategy

| Platform | When | Why |
|:---|:---|:---|
| **HN** | Saturday 7am ET | Highest visibility, weekend front page lasts longer |
| **X** | Monday 9am ET | Weekday tech audience |
| **r/rust** | After X thread | Cross-link for credibility |
| **r/ML** | After r/rust | Different angle (L2 loss story) |
| **LinkedIn** | Any weekday | Investor/enterprise visibility |
