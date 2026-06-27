// Presence Scorer — Multi-Factor Verification (MVP).
//
// Combines three factors:
//   M: Motion Signature score (weight 0.6)
//   D: Device Attestation score (weight 0.25)
//   C: Context score (weight 0.15)
//
// Weights are static for MVP; interface is future-proofed for
// risk-adaptive weighting (Multi-Factor Formalization §2.3, Patch 3).
//
// Hard gates:
//   - Motion score < 0.0 → immediate rejection (zero motion)
//   - Device score = 0.0 → immediate rejection (device mismatch or rooted)
//   - Context score = 0.0 → immediate rejection (impossible location jump)

use crate::motion::signature::MotionSignatureEngine;
use crate::types::*;

/// MVP factor weights.
const WEIGHT_MOTION: f64 = 0.60;
const WEIGHT_DEVICE: f64 = 0.25;
const WEIGHT_CONTEXT: f64 = 0.15;

/// Verifier for presence proofs.
pub struct PresenceScorer {
    /// Enrolled user data.
    enrollment: Enrollment,
    /// Previous verification record for context continuity.
    previous_verification: Option<PreviousVerification>,
}

/// Record of a previous verification for context checks.
#[derive(Debug, Clone)]
struct PreviousVerification {
    device_id: String,
    location: Option<LocationInfo>,
    #[allow(dead_code)]
    timestamp: f64, // Reserved for future temporal drift detection (v1.1+)
}

impl PresenceScorer {
    /// Create a new scorer for an enrolled user.
    pub fn new(enrollment: Enrollment) -> Self {
        Self {
            enrollment,
            previous_verification: None,
        }
    }

    /// Verify a challenge response against the enrolled signature.
    /// On WASM, use `verify_with_timestamp` instead.
    pub fn verify(
        &mut self,
        response: &ChallengeResponse,
        response_signature: &MotionSignature,
        risk_level: RiskLevel,
    ) -> VerificationResult {
        self.verify_with_timestamp(response, response_signature, risk_level, current_timestamp())
    }

    /// Verify with an externally provided timestamp (required for WASM).
    pub fn verify_with_timestamp(
        &mut self,
        response: &ChallengeResponse,
        response_signature: &MotionSignature,
        risk_level: RiskLevel,
        now: f64,
    ) -> VerificationResult {
        // ── Factor 1: Motion Signature ──────────────────────────────
        let motion_score = MotionSignatureEngine::similarity(
            &self.enrollment.signature,
            response_signature,
        );

        // Hard gate: zero motion similarity
        if motion_score <= 0.0 {
            return VerificationResult {
                verified: false,
                presence_score: 0.0,
                factors: FactorScores {
                    motion: motion_score,
                    device: 0.0,
                    context: 0.0,
                },
                risk_level,
                threshold: risk_level.threshold(),
                rejection_reason: Some("motion_signature_mismatch".into()),
            };
        }

        // ── Factor 2: Device Attestation ────────────────────────────
        let device_score = compute_device_score(
            &self.enrollment.device_info,
            &response.device_info,
        );

        // Hard gate: device mismatch or rooted
        if device_score <= 0.0 {
            return VerificationResult {
                verified: false,
                presence_score: 0.0,
                factors: FactorScores {
                    motion: motion_score,
                    device: device_score,
                    context: 0.0,
                },
                risk_level,
                threshold: risk_level.threshold(),
                rejection_reason: Some("device_attestation_failed".into()),
            };
        }

        // ── Factor 3: Context ───────────────────────────────────────
        let context_score = compute_context_score(
            self.previous_verification.as_ref(),
            &response.device_info,
            response.location.as_ref(),
        );

        // Hard gate: impossible location jump
        if context_score <= 0.0 {
            return VerificationResult {
                verified: false,
                presence_score: 0.0,
                factors: FactorScores {
                    motion: motion_score,
                    device: device_score,
                    context: context_score,
                },
                risk_level,
                threshold: risk_level.threshold(),
                rejection_reason: Some("context_anomaly".into()),
            };
        }

        // ── Composite Score ─────────────────────────────────────────
        let presence_score =
            WEIGHT_MOTION * motion_score +
            WEIGHT_DEVICE * device_score +
            WEIGHT_CONTEXT * context_score;

        let threshold = risk_level.threshold();
        let verified = presence_score >= threshold;

        // Record this verification for future context checks
        self.previous_verification = Some(PreviousVerification {
            device_id: response.device_info.device_id.clone(),
            location: response.location.clone(),
            timestamp: now,
        });

        let rejection_reason = if !verified {
            Some(format!(
                "below_threshold: score={:.3} < threshold={:.3}",
                presence_score, threshold
            ))
        } else {
            None
        };

        VerificationResult {
            verified,
            presence_score,
            factors: FactorScores {
                motion: motion_score,
                device: device_score,
                context: context_score,
            },
            risk_level,
            threshold,
            rejection_reason,
        }
    }

    /// Update the enrolled signature (e.g., after collecting more samples).
    pub fn update_enrollment(&mut self, enrollment: Enrollment) {
        self.enrollment = enrollment;
    }

    /// Get the current enrollment reference.
    pub fn enrollment(&self) -> &Enrollment {
        &self.enrollment
    }
}

// ── Factor Scoring Functions ────────────────────────────────────────

/// Compute the Device Attestation score.
///
/// Scoring (MVP v0.2 — enhanced with IMU check):
///   1.0 = same device + not rooted + IMU present ≥100Hz
///   0.5 = same device + not rooted (no IMU or <100Hz)
///   0.0 = device mismatch OR rooted/jailbroken
///
/// Rationale (Patch from MVP v0.2):
///   The IMU sampling rate check increases B3 attack cost by 1–2 orders
///   of magnitude. An attacker who hooks the camera must now also inject
///   synchronized IMU data at ≥100Hz — a significantly harder problem.
fn compute_device_score(enrollment_device: &DeviceInfo, response_device: &DeviceInfo) -> f64 {
    // Hard reject: rooted device
    if response_device.is_rooted {
        return 0.0;
    }

    // Hard reject: device mismatch
    if enrollment_device.device_id != response_device.device_id {
        return 0.0;
    }

    // Check IMU presence and sample rate
    let has_adequate_imu = response_device
        .imu_sample_rate_hz
        .map(|rate| rate >= 100)
        .unwrap_or(false);

    if has_adequate_imu {
        1.0
    } else {
        0.5
    }
}

/// Compute the Context score.
///
/// MVP sub-factors:
///   - Location continuity (weight 0.5): speed between consecutive verifications
///     must be physically plausible (< 1000 km/h)
///   - Device history (weight 0.5): whether the current device matches
///     the device used in recent verifications
fn compute_context_score(
    previous: Option<&PreviousVerification>,
    device: &DeviceInfo,
    location: Option<&LocationInfo>,
) -> f64 {
    let mut score = 1.0f64;

    if let Some(prev) = previous {
        // Location continuity check
        if let (Some(prev_loc), Some(curr_loc)) = (&prev.location, location) {
            let loc_score = compute_location_continuity(prev_loc, curr_loc);
            if loc_score <= 0.0 {
                return 0.0; // Hard gate: impossible location jump
            }
            score *= 0.5 + 0.5 * loc_score;
        }

        // Device history check
        let device_score = if device.device_id == prev.device_id {
            1.0
        } else {
            0.5 // Device changed — unusual but not impossible
        };
        score *= 0.5 + 0.5 * device_score;
    }
    // If no previous verification, context score defaults to 1.0
    // (no history to compare against — this is the cold-start case)

    score.clamp(0.0, 1.0)
}

/// Check whether two locations imply physically impossible travel.
///
/// Uses the Haversine formula to compute great-circle distance,
/// then checks whether the implied speed exceeds the maximum
/// commercial aircraft speed (~1000 km/h).
fn compute_location_continuity(prev: &LocationInfo, curr: &LocationInfo) -> f64 {
    let dt = (curr.timestamp - prev.timestamp).abs();
    if dt < 1.0 {
        return 1.0; // Too close in time to judge
    }

    let distance_km = haversine_distance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude,
    );

    let speed_kmh = distance_km / (dt / 3600.0);

    // Maximum plausible speed: commercial aircraft (~1000 km/h)
    // Add 20% margin for supersonic / measurement error
    let max_speed = 1200.0;

    if speed_kmh > max_speed {
        0.0 // Impossible — hard rejection
    } else if speed_kmh > 500.0 {
        // Plausible but unusual (private jet speed)
        1.0 - (speed_kmh - 500.0) / 700.0
    } else {
        1.0 // Normal travel speed
    }
}

/// Haversine formula for great-circle distance (km).
fn haversine_distance(lat1: f64, lon1: f64, lat2: f64, lon2: f64) -> f64 {
    let r = 6371.0; // Earth radius in km
    let dlat = (lat2 - lat1).to_radians();
    let dlon = (lon2 - lon1).to_radians();
    let a = (dlat / 2.0).sin().powi(2)
        + lat1.to_radians().cos() * lat2.to_radians().cos() * (dlon / 2.0).sin().powi(2);
    let c = 2.0 * a.sqrt().asin();
    r * c
}

fn current_timestamp() -> f64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs_f64()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_enrollment() -> Enrollment {
        Enrollment {
            user_id: "test-user-1".into(),
            signature: MotionSignature {
                vector: nalgebra::DVector::from_element(128, 0.1),
                version: 1,
            },
            variance: 0.01,
            sample_count: 20,
            enrolled_at: 1710000000.0,
            device_info: DeviceInfo {
                os: "ios".into(),
                model: "iPhone 15 Pro".into(),
                device_id: "device-abc123".into(),
                is_rooted: false,
                imu_sample_rate_hz: Some(200),
            },
        }
    }

    #[test]
    fn test_device_score_full() {
        let enroll_dev = DeviceInfo {
            os: "ios".into(),
            model: "iPhone".into(),
            device_id: "dev1".into(),
            is_rooted: false,
            imu_sample_rate_hz: Some(200),
        };
        let resp_dev = DeviceInfo {
            os: "ios".into(),
            model: "iPhone".into(),
            device_id: "dev1".into(),
            is_rooted: false,
            imu_sample_rate_hz: Some(200),
        };
        assert_eq!(compute_device_score(&enroll_dev, &resp_dev), 1.0);
    }

    #[test]
    fn test_device_score_no_imu() {
        let enroll_dev = DeviceInfo {
            os: "ios".into(),
            model: "iPhone".into(),
            device_id: "dev1".into(),
            is_rooted: false,
            imu_sample_rate_hz: Some(200),
        };
        let resp_dev = DeviceInfo {
            os: "ios".into(),
            model: "iPhone".into(),
            device_id: "dev1".into(),
            is_rooted: false,
            imu_sample_rate_hz: None,
        };
        assert_eq!(compute_device_score(&enroll_dev, &resp_dev), 0.5);
    }

    #[test]
    fn test_device_score_rooted_rejected() {
        let enroll_dev = DeviceInfo {
            os: "ios".into(),
            model: "iPhone".into(),
            device_id: "dev1".into(),
            is_rooted: false,
            imu_sample_rate_hz: Some(200),
        };
        let resp_dev = DeviceInfo {
            os: "ios".into(),
            model: "iPhone".into(),
            device_id: "dev1".into(),
            is_rooted: true,
            imu_sample_rate_hz: Some(200),
        };
        assert_eq!(compute_device_score(&enroll_dev, &resp_dev), 0.0);
    }

    #[test]
    fn test_device_score_mismatch_rejected() {
        let enroll_dev = DeviceInfo {
            os: "ios".into(),
            model: "iPhone".into(),
            device_id: "dev1".into(),
            is_rooted: false,
            imu_sample_rate_hz: Some(200),
        };
        let resp_dev = DeviceInfo {
            os: "ios".into(),
            model: "Pixel".into(),
            device_id: "dev2".into(),
            is_rooted: false,
            imu_sample_rate_hz: Some(100),
        };
        assert_eq!(compute_device_score(&enroll_dev, &resp_dev), 0.0);
    }

    #[test]
    fn test_location_continuity_normal() {
        let prev = LocationInfo {
            latitude: 31.23, // Shanghai
            longitude: 121.47,
            timestamp: 1000.0,
        };
        let curr = LocationInfo {
            latitude: 31.24,
            longitude: 121.48,
            timestamp: 13600.0, // 3.5 hours later
        };
        let score = compute_location_continuity(&prev, &curr);
        assert!(score > 0.9, "Normal travel should score high, got {}", score);
    }

    #[test]
    fn test_location_continuity_impossible() {
        let prev = LocationInfo {
            latitude: 31.23, // Shanghai
            longitude: 121.47,
            timestamp: 1000.0,
        };
        let curr = LocationInfo {
            latitude: 40.71, // New York
            longitude: -74.00,
            timestamp: 4600.0, // 1 hour later — impossible
        };
        let score = compute_location_continuity(&prev, &curr);
        assert_eq!(score, 0.0, "Impossible travel must be rejected");
    }

    #[test]
    fn test_haversine() {
        // Shanghai → Beijing ≈ 1068 km
        let d = haversine_distance(31.23, 121.47, 39.90, 116.40);
        assert!((d - 1068.0).abs() < 100.0, "Shanghai-Beijing ~1068 km, got {}", d);
    }

    #[test]
    fn test_verification_accepts_matching() {
        let enrollment = make_enrollment();
        let mut scorer = PresenceScorer::new(enrollment);

        // Build a response that matches the enrollment
        let response = ChallengeResponse {
            challenge_id: uuid::Uuid::new_v4(),
            user_id: "test-user-1".into(),
            pose_sequence: MotionSequence { fps: 30, frames: vec![] },
            imu_sequence: ImuSequence { sample_rate_hz: 200, samples: vec![] },
            device_info: DeviceInfo {
                os: "ios".into(),
                model: "iPhone 15 Pro".into(),
                device_id: "device-abc123".into(),
                is_rooted: false,
                imu_sample_rate_hz: Some(200),
            },
            location: Some(LocationInfo {
                latitude: 31.23,
                longitude: 121.47,
                timestamp: 1710000100.0,
            }),
        };

        // Create a signature identical to enrollment → motion_score should be 1.0
        let sig = MotionSignature {
            vector: nalgebra::DVector::from_element(128, 0.1),
            version: 1,
        };

        let result = scorer.verify(&response, &sig, RiskLevel::Medium);
        assert!(result.verified, "Identical signatures should pass, got rejection: {:?}", result.rejection_reason);
        assert!(result.presence_score > 0.7);
        assert_eq!(result.factors.device, 1.0);
    }
}
