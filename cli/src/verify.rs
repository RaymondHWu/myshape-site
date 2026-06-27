// MyShape Protocol — CLI Verification Tool
//
// One-off verification from JSON files.
//
// Usage:
//   cargo run --bin myshape-verify -- \
//     --enrollment enrollment.json \
//     --challenge challenge.json \
//     --motion motion.json \
//     --device device.json \
//     --risk medium

use myshape_engine::motion::signature::MotionSignatureEngine;
use myshape_engine::types::*;
use myshape_engine::verification::PresenceScorer;
use std::fs;

fn main() {
    let args: Vec<String> = std::env::args().collect();

    // Parse named arguments
    let enrollment_path = parse_arg(&args, "--enrollment");
    let challenge_path = parse_arg(&args, "--challenge");
    let motion_path = parse_arg(&args, "--motion");
    let device_path = parse_arg(&args, "--device");
    let risk_str = parse_arg(&args, "--risk").unwrap_or_else(|| "medium".to_string());

    if enrollment_path.is_none() || challenge_path.is_none() || motion_path.is_none() {
        eprintln!("Usage: myshape-verify --enrollment <file> --challenge <file> --motion <file> [--device <file>] [--risk low|medium|high]");
        std::process::exit(1);
    }

    // Load inputs
    let enrollment_json = fs::read_to_string(enrollment_path.unwrap()).expect("read enrollment");
    let challenge_json = fs::read_to_string(challenge_path.unwrap()).expect("read challenge");
    let motion_json = fs::read_to_string(motion_path.unwrap()).expect("read motion");

    let enrollment: Enrollment = serde_json::from_str(&enrollment_json).expect("parse enrollment");
    let _challenge: Challenge = serde_json::from_str(&challenge_json).expect("parse challenge");
    let motion: MotionSequence = serde_json::from_str(&motion_json).expect("parse motion");

    let device: DeviceInfo = if let Some(dp) = device_path {
        let dj = fs::read_to_string(&dp).expect("read device");
        serde_json::from_str(&dj).expect("parse device")
    } else {
        DeviceInfo {
            os: "unknown".into(),
            model: "unknown".into(),
            device_id: "cli-verify".into(),
            is_rooted: false,
            imu_sample_rate_hz: Some(200),
        }
    };

    let risk = match risk_str.as_str() {
        "high" => RiskLevel::High,
        "low" => RiskLevel::Low,
        _ => RiskLevel::Medium,
    };

    // Extract signature
    let engine = MotionSignatureEngine::new();
    let sig = engine.extract(&motion);

    // Build response
    let response = ChallengeResponse {
        challenge_id: uuid::Uuid::parse_str("00000000-0000-0000-0000-000000000000").unwrap(),
        user_id: enrollment.user_id.clone(),
        pose_sequence: motion,
        imu_sequence: ImuSequence { sample_rate_hz: 200, samples: vec![] },
        device_info: device,
        location: None,
    };

    // Verify
    let mut scorer = PresenceScorer::new(enrollment);
    let result = scorer.verify(&response, &sig, risk);

    // Output JSON result
    println!("{}", serde_json::to_string_pretty(&result).unwrap());
}

fn parse_arg(args: &[String], name: &str) -> Option<String> {
    let mut i = 0;
    while i < args.len() {
        if args[i] == name && i + 1 < args.len() {
            return Some(args[i + 1].clone());
        }
        i += 1;
    }
    None
}
