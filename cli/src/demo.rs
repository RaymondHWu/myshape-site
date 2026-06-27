// MyShape Protocol — CLI Demo
//
// "Human vs AI Forgery" comparison demonstration.
// Generates synthetic data, runs verification, outputs results.
//
// Usage:
//   cargo run --bin myshape-demo
//   cargo run --bin myshape-demo -- --verbose

use myshape_engine::challenge::ChallengeGenerator;
use myshape_engine::motion::signature::MotionSignatureEngine;
use myshape_engine::types::*;
use myshape_engine::verification::PresenceScorer;
use std::env;

// ── Color helpers ────────────────────────────────────────────────────
const C_RESET: &str = "\x1b[0m";
const C_BOLD: &str = "\x1b[1m";
const C_DIM: &str = "\x1b[2m";
const C_RED: &str = "\x1b[31m";
const C_GREEN: &str = "\x1b[32m";
const C_YELLOW: &str = "\x1b[33m";
const C_CYAN: &str = "\x1b[36m";

fn banner(text: &str) {
    let line = "═".repeat(62);
    println!("\n{C_CYAN}{line}{C_RESET}");
    println!("{C_BOLD}{C_CYAN}  {text}{C_RESET}");
    println!("{C_CYAN}{line}{C_RESET}\n");
}

fn verdict(passed: bool, score: f64) -> String {
    if passed {
        format!("\x1b[42m\x1b[1m  PASS  \x1b[0m  score: {:.4}", score)
    } else {
        format!("\x1b[41m\x1b[1m  FAIL  \x1b[0m  score: {:.4}", score)
    }
}

fn factor_bar(label: &str, score: f64) -> String {
    let width = 30;
    let filled = (score.max(0.0).min(1.0) * width as f64).round() as usize;
    let empty = width - filled;
    let bar = format!("{}{}", "█".repeat(filled), "░".repeat(empty));
    let color = if score > 0.7 { C_GREEN } else if score > 0.4 { C_YELLOW } else { C_RED };
    format!("{:<12} {}{bar}{C_RESET} {:.3}", label, color, score)
}

// ── Motion Generation ────────────────────────────────────────────────

fn pseudo_random(state: &mut u64) -> f32 {
    *state ^= *state << 13;
    *state ^= *state >> 7;
    *state ^= *state << 17;
    (*state as f32) / (u64::MAX as f32)
}

/// Generate synthetic human motion with realistic micro-tremor.
fn generate_human_motion(duration_s: f32, fps: u32, amplitude: f32) -> MotionSequence {
    let n_frames = (duration_s * fps as f32).ceil() as usize;
    let dt = 1.0 / fps as f32;
    let mut rng_state: u64 = 12345;
    let mut frames = Vec::with_capacity(n_frames);

    for i in 0..n_frames {
        let t = i as f32 * dt;
        let mut keypoints = Vec::with_capacity(33);

        for kp_idx in 0..33 {
            let phase = t * 2.0 * std::f32::consts::PI;
            let base_x = amplitude * phase.sin();
            let base_y = amplitude * phase.cos();
            let base_z = 0.02 * (t * 3.0).sin();

            // Physiological tremor: 8-12 Hz
            let tremor_freq = 9.5 + 0.5 * pseudo_random(&mut rng_state);
            let tremor_amp = 0.002 + 0.001 * pseudo_random(&mut rng_state);
            let tremor = tremor_amp * (t * tremor_freq * 2.0 * std::f32::consts::PI).sin();

            // 1/f-like jerk noise
            let jerk_noise = 0.0015 * (t * 5.3).sin()
                + 0.0010 * (t * 11.7).sin()
                + 0.0007 * (t * 23.1).sin()
                + 0.0004 * (t * 37.3).sin()
                + 0.0002 * (t * 51.9).sin();

            // Muscle micro-perturbation
            let muscle_noise = 0.0008 * pseudo_random(&mut rng_state)
                * (1.0 + 0.3 * (t * 0.7).sin());

            // Natural latency variation per keypoint
            let latency = (kp_idx as f32 * 0.0003) * (t * 2.1).cos();

            let x = base_x + tremor + jerk_noise + muscle_noise + latency;
            let y = base_y + tremor * 0.7 + jerk_noise * 0.8 + muscle_noise * 0.9;
            let z = base_z + tremor * 0.3 + jerk_noise * 0.5;

            keypoints.push(Keypoint { x, y, z });
        }
        frames.push(PoseFrame { t, keypoints });
    }
    MotionSequence { fps, frames }
}

/// Generate synthetic AI-forged motion (over-smoothed, no tremor).
fn generate_ai_motion(duration_s: f32, fps: u32, amplitude: f32) -> MotionSequence {
    let n_frames = (duration_s * fps as f32).ceil() as usize;
    let dt = 1.0 / fps as f32;
    let mut frames = Vec::with_capacity(n_frames);

    for i in 0..n_frames {
        let t = i as f32 * dt;
        let mut keypoints = Vec::with_capacity(33);

        for _kp_idx in 0..33 {
            let phase = t * 2.0 * std::f32::consts::PI;
            let base_x = amplitude * phase.sin();
            let base_y = amplitude * phase.cos();
            let base_z = 0.02 * (t * 3.0).sin();

            // AI over-smoothing: no tremor, no jerk complexity, no muscle noise
            let smooth = 0.98;
            let x = base_x * smooth;
            let y = base_y * smooth;
            let z = base_z * smooth;

            keypoints.push(Keypoint { x, y, z });
        }
        frames.push(PoseFrame { t, keypoints });
    }
    MotionSequence { fps, frames }
}

// ── Main ─────────────────────────────────────────────────────────────

fn main() {
    let verbose = env::args().any(|a| a == "--verbose");

    banner("MyShape Protocol — Human vs AI Forgery Demo");

    // ── Step 1: Initialize Engine ─────────────────────────────────
    println!("{C_BOLD}── Step 1: Initializing MyShape Engine{C_RESET}\n");
    let engine = MotionSignatureEngine::new();
    println!("  {C_GREEN}✓{C_RESET} Motion Signature Engine initialized (128-dim, 4 feature groups)");

    // ── Step 2: Enrollment ────────────────────────────────────────
    println!("\n{C_BOLD}── Step 2: Enrolling Human User{C_RESET}\n");
    println!("  Generating 20 enrollment motion samples...");

    let mut enrollment_signatures = Vec::new();
    for i in 0..20 {
        let motion = generate_human_motion(3.0, 30, 0.15 + (i as f32 * 0.001));
        let sig = engine.extract(&motion);
        enrollment_signatures.push(sig);
    }

    let enrolled = MotionSignatureEngine::enroll(&enrollment_signatures);
    let variance = MotionSignatureEngine::compute_variance(&enrollment_signatures);

    println!("  {C_GREEN}✓{C_RESET} 20 signatures extracted");
    println!("  {C_GREEN}✓{C_RESET} Enrollment complete — variance: {:.6}", variance);

    let device = DeviceInfo {
        os: "ios".into(),
        model: "iPhone 15 Pro".into(),
        device_id: "demo-device-001".into(),
        is_rooted: false,
        imu_sample_rate_hz: Some(200),
    };

    let enrollment = Enrollment {
        user_id: "demo-user-001".into(),
        signature: enrolled,
        variance,
        sample_count: 20,
        enrolled_at: 1710000000.0,
        device_info: device.clone(),
    };

    // ── Step 3: Generate Challenge ─────────────────────────────────
    println!("\n{C_BOLD}── Step 3: Issuing Challenge{C_RESET}\n");

    let session_key = vec![0x42u8; 32];
    let mut gen = ChallengeGenerator::new(session_key);
    let challenge = gen.generate();

    println!("  Challenge ID: {}...", &challenge.challenge_id.to_string()[..12]);
    for action in &challenge.actions {
        let role = match action.action_type {
            ActionType::Constraint => format!("{C_YELLOW}constraint{C_RESET}"),
            _ => format!("{:?}", action.action_type),
        };
        println!("    • [{role}] {:?}: {:?}", action.joint, action.motion);
    }
    println!("  {C_DIM}Coupling constraint: present{C_RESET}");

    // ── Step 4: Test — Genuine Human ──────────────────────────────
    banner("Test 1: GENUINE HUMAN MOTION");
    println!("  Source: Same user, realistic micro-tremor & jerk dynamics");

    let human_motion = generate_human_motion(3.5, 30, 0.15);
    let human_sig = engine.extract(&human_motion);

    let human_response = ChallengeResponse {
        challenge_id: challenge.challenge_id,
        user_id: "demo-user-001".into(),
        pose_sequence: human_motion,
        imu_sequence: ImuSequence { sample_rate_hz: 200, samples: vec![] },
        device_info: device.clone(),
        location: Some(LocationInfo { latitude: 31.23, longitude: 121.47, timestamp: 1710000100.0 }),
    };

    let mut scorer = PresenceScorer::new(enrollment.clone());
    let human_result = scorer.verify(&human_response, &human_sig, RiskLevel::Medium);

    println!("\n  {}", verdict(human_result.verified, human_result.presence_score));
    println!("  Risk: {:?} | Threshold: {:.2}", human_result.risk_level, human_result.threshold);
    println!("\n  Factor Breakdown:");
    println!("  {}", factor_bar("Motion", human_result.factors.motion));
    println!("  {}", factor_bar("Device", human_result.factors.device));
    println!("  {}", factor_bar("Context", human_result.factors.context));

    if verbose {
        let sim = MotionSignatureEngine::similarity(&enrollment.signature, &human_sig);
        println!("\n  {C_DIM}Similarity to enrollment: {:.4}{C_RESET}", sim);
    }

    // ── Step 5: Test — AI Forgery ─────────────────────────────────
    banner("Test 2: AI-FORGED MOTION");
    println!("  Source: AI diffusion model output — over-smoothed, no tremor");

    let ai_motion = generate_ai_motion(3.5, 30, 0.15);
    let ai_sig = engine.extract(&ai_motion);

    let ai_response = ChallengeResponse {
        challenge_id: challenge.challenge_id,
        user_id: "demo-user-001".into(),
        pose_sequence: ai_motion,
        imu_sequence: ImuSequence { sample_rate_hz: 200, samples: vec![] },
        device_info: device.clone(),
        location: Some(LocationInfo { latitude: 31.23, longitude: 121.47, timestamp: 1710000100.0 }),
    };

    let mut scorer2 = PresenceScorer::new(enrollment.clone());
    let ai_result = scorer2.verify(&ai_response, &ai_sig, RiskLevel::Medium);

    println!("\n  {}", verdict(ai_result.verified, ai_result.presence_score));
    println!("  Risk: {:?} | Threshold: {:.2}", ai_result.risk_level, ai_result.threshold);
    if let Some(ref reason) = ai_result.rejection_reason {
        println!("  {C_RED}Rejection: {reason}{C_RESET}");
    }
    println!("\n  Factor Breakdown:");
    println!("  {}", factor_bar("Motion", ai_result.factors.motion));
    println!("  {}", factor_bar("Device", ai_result.factors.device));
    println!("  {}", factor_bar("Context", ai_result.factors.context));

    if verbose {
        let human_ai_sim = MotionSignatureEngine::similarity(&human_sig, &ai_sig);
        println!("\n  {C_DIM}Human-vs-AI signature similarity: {:.4}{C_RESET}", human_ai_sim);
    }

    // ── Step 6: Test — Different Device (Impostor) ─────────────────
    banner("Test 3: IMPOSTOR (Different Person + Different Device)");
    println!("  Source: Different human, different amplitude, different device");

    let impostor_motion = generate_human_motion(3.5, 30, 0.28);
    let impostor_sig = engine.extract(&impostor_motion);

    let impostor_device = DeviceInfo {
        os: "android".into(),
        model: "Pixel 8".into(),
        device_id: "impostor-device-999".into(),
        is_rooted: false,
        imu_sample_rate_hz: Some(100),
    };

    let impostor_response = ChallengeResponse {
        challenge_id: challenge.challenge_id,
        user_id: "impostor-002".into(),
        pose_sequence: impostor_motion,
        imu_sequence: ImuSequence { sample_rate_hz: 100, samples: vec![] },
        device_info: impostor_device,
        location: Some(LocationInfo { latitude: 31.23, longitude: 121.47, timestamp: 1710000100.0 }),
    };

    let mut scorer3 = PresenceScorer::new(enrollment.clone());
    let impostor_result = scorer3.verify(&impostor_response, &impostor_sig, RiskLevel::Medium);

    println!("\n  {}", verdict(impostor_result.verified, impostor_result.presence_score));
    println!("  Risk: {:?} | Threshold: {:.2}", impostor_result.risk_level, impostor_result.threshold);
    if let Some(ref reason) = impostor_result.rejection_reason {
        println!("  {C_RED}Rejection: {reason}{C_RESET}");
    }
    println!("\n  Factor Breakdown:");
    println!("  {}", factor_bar("Motion", impostor_result.factors.motion));
    println!("  {}", factor_bar("Device", impostor_result.factors.device));
    println!("  {}", factor_bar("Context", impostor_result.factors.context));

    // ── Summary ──────────────────────────────────────────────────
    banner("VERIFICATION SUMMARY");

    let results = [
        ("Genuine Human", &human_result, true),
        ("AI Forgery", &ai_result, false),
        ("Impostor", &impostor_result, false),
    ];

    println!("  {C_BOLD}{:<22} {:<16} {:<10} {:<10} Match?{C_RESET}", "Test Case", "Presence Score", "Verdict", "Expected");
    println!("  {}", "─".repeat(72));

    for (name, r, expected) in &results {
        let v = if r.verified { format!("{C_GREEN}PASS{C_RESET}") } else { format!("{C_RED}FAIL{C_RESET}") };
        let e = if *expected { "PASS" } else { "FAIL" };
        let m = if r.verified == *expected { format!("{C_GREEN}✓{C_RESET}") } else { format!("{C_RED}✗{C_RESET}") };
        println!("  {:<22} {:<16} {:<26} {:<10} {m}", name, format!("{:.4}", r.presence_score), v, e);
    }

    // ── Analysis ──────────────────────────────────────────────────
    banner("ANALYSIS");

    let human_ai_gap = human_result.presence_score - ai_result.presence_score;
    let human_impostor_gap = human_result.presence_score - impostor_result.presence_score;

    println!("  Human vs AI forgery gap:     {C_BOLD}{:.4}{C_RESET}", human_ai_gap);
    println!("  Human vs Impostor gap:       {C_BOLD}{:.4}{C_RESET}", human_impostor_gap);
    println!();

    if ai_result.verified {
        println!("  {C_RED}⚠  AI forgery PASSED — security boundary breached{C_RESET}");
    } else {
        println!("  {C_GREEN}✓  AI forgery correctly REJECTED{C_RESET}");
        println!("  {C_DIM}  Motion Signature detected absence of:{C_RESET}");
        println!("  {C_DIM}    • Physiological tremor (8-12 Hz){C_RESET}");
        println!("  {C_DIM}    • Natural jerk spectrum (1/f scaling){C_RESET}");
        println!("  {C_DIM}    • Muscle micro-perturbations{C_RESET}");
        println!("  {C_DIM}    • Acceleration burstiness (Hurst anomaly){C_RESET}");
    }

    if impostor_result.verified {
        println!("  {C_RED}⚠  Impostor PASSED — uniqueness check failed{C_RESET}");
    } else {
        println!("  {C_GREEN}✓  Impostor correctly REJECTED (different kinematics + device){C_RESET}");
    }

    println!();
    println!("  {C_BOLD}Protocol:{C_RESET} Motion-native presence verification — operational.");
    println!("  {C_BOLD}Threat Model:{C_RESET} Active challenge-response + multi-factor defense-in-depth.");
    println!();
}
