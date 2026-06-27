// Challenge Generator — MVP implementation.
//
// Generates challenges satisfying:
//   - Unpredictable (CSPRNG-based, >10^6 effective combinations for MVP)
//   - Multi-action (2–3 actions)
//   - At least one kinetic chain coupling constraint
//   - 100ms start window
//   - Random timing perturbation
//
// Corresponds to: MVP spec §2, Challenge Protocol §1–2.

use crate::types::*;
use rand::seq::SliceRandom;
use rand::{Rng, SeedableRng};
use rand_chacha::ChaCha20Rng;
use sha2::{Digest, Sha256};
use uuid::Uuid;

/// Challenge generator using CSPRNG for unpredictability.
pub struct ChallengeGenerator {
    rng: ChaCha20Rng,
    /// Session key for HMAC challenge binding.
    session_key: Vec<u8>,
}

impl ChallengeGenerator {
    /// Create a new generator with a random seed and session key.
    pub fn new(session_key: Vec<u8>) -> Self {
        let mut seed = [0u8; 32];
        getrandom::getrandom(&mut seed).expect("CSPRNG seed failed");
        Self {
            rng: ChaCha20Rng::from_seed(seed),
            session_key,
        }
    }

    /// Create a generator from an existing seed (for testing).
    pub fn from_seed(seed: [u8; 32], session_key: Vec<u8>) -> Self {
        Self {
            rng: ChaCha20Rng::from_seed(seed),
            session_key,
        }
    }

    /// Generate a single challenge using the system clock.
    /// On WASM, use `generate_with_timestamp` instead.
    pub fn generate(&mut self) -> Challenge {
        self.generate_with_timestamp(current_timestamp())
    }

    /// Generate a single challenge with an externally provided timestamp.
    /// Required for WASM where `SystemTime::now()` is unavailable.
    ///
    /// The challenge will contain:
    /// - 1 primary action (randomly selected from the MVP action library)
    /// - 1 secondary action (different joint group from primary)
    /// - 1 coupling constraint (shares kinetic chain with primary or secondary)
    /// - Timing perturbation
    pub fn generate_with_timestamp(&mut self, timestamp: f64) -> Challenge {
        let challenge_id = Uuid::new_v4();
        let nonce: [u8; 16] = self.rng.gen();

        // Step 1: Select primary action
        let primary = self.random_primary();

        // Step 2: Select secondary action (different joint group)
        let secondary = self.random_secondary(&primary);

        // Step 3: Select coupling constraint (shares kinetic chain)
        let constraint = self.select_coupling_constraint(&primary, &secondary);

        // Step 4: Random perturbation
        let perturbation = self.random_perturbation();

        let actions = vec![primary, secondary, constraint];
        let timing = TimingConstraints {
            start_window_ms: 100,
            hold_ms: Some(200 + self.rng.gen_range(0..=200)),
            perturbation: Some(perturbation),
        };
        let duration_ms = 3000 + self.rng.gen_range(0..=1000);

        // Build challenge object (without token first)
        let mut challenge = Challenge {
            challenge_id,
            timestamp,
            duration_ms,
            actions,
            timing,
            nonce,
            challenge_token: Vec::new(), // placeholder
        };

        // Step 5: HMAC bind challenge to session
        let token = self.hmac_challenge(&challenge);
        challenge.challenge_token = token;

        challenge
    }

    // ── Private helpers ──────────────────────────────────────────────

    /// Select a random primary action from the MVP library.
    fn random_primary(&mut self) -> ChallengeAction {
        let joints = [
            Joint::RightHand,
            Joint::LeftHand,
            Joint::RightElbow,
            Joint::LeftElbow,
        ];
        let motions = [
            MotionType::Circle,
            MotionType::Line,
            MotionType::Triangle,
            MotionType::UpDown,
            MotionType::LeftRight,
        ];
        let amplitudes = [Amplitude::Small, Amplitude::Medium, Amplitude::Large];

        let joint = *joints.choose(&mut self.rng).unwrap();
        let motion = *motions.choose(&mut self.rng).unwrap();
        let amplitude = *amplitudes.choose(&mut self.rng).unwrap();

        let direction = match motion {
            MotionType::Circle => Some(if self.rng.gen_bool(0.5) {
                Direction::Clockwise
            } else {
                Direction::Counterclockwise
            }),
            MotionType::UpDown => Some(if self.rng.gen_bool(0.5) {
                Direction::Up
            } else {
                Direction::Down
            }),
            MotionType::LeftRight => Some(if self.rng.gen_bool(0.5) {
                Direction::Left
            } else {
                Direction::Right
            }),
            _ => None,
        };

        ChallengeAction {
            action_type: ActionType::Primary,
            joint,
            motion,
            direction,
            amplitude: Some(amplitude),
            angle_deg: None,
        }
    }

    /// Select a secondary action from a different joint group.
    fn random_secondary(&mut self, primary: &ChallengeAction) -> ChallengeAction {
        // Available joints excluding primary's joint group
        let available_joints = match primary.joint {
            Joint::RightHand | Joint::RightElbow | Joint::RightShoulder => {
                vec![Joint::LeftHand, Joint::LeftElbow, Joint::Torso, Joint::Head]
            }
            Joint::LeftHand | Joint::LeftElbow | Joint::LeftShoulder => {
                vec![Joint::RightHand, Joint::RightElbow, Joint::Torso, Joint::Head]
            }
            _ => vec![
                Joint::RightHand,
                Joint::LeftHand,
                Joint::RightElbow,
                Joint::LeftElbow,
            ],
        };

        let joint = *available_joints.choose(&mut self.rng).unwrap();
        let motions = [MotionType::Circle, MotionType::UpDown, MotionType::LeftRight];
        let motion = *motions.choose(&mut self.rng).unwrap();

        let direction = match motion {
            MotionType::Circle => Some(if self.rng.gen_bool(0.5) {
                Direction::Clockwise
            } else {
                Direction::Counterclockwise
            }),
            MotionType::UpDown => Some(if self.rng.gen_bool(0.5) {
                Direction::Up
            } else {
                Direction::Down
            }),
            MotionType::LeftRight => Some(if self.rng.gen_bool(0.5) {
                Direction::Left
            } else {
                Direction::Right
            }),
            _ => None,
        };

        ChallengeAction {
            action_type: ActionType::Secondary,
            joint,
            motion,
            direction,
            amplitude: Some(Amplitude::Medium),
            angle_deg: None,
        }
    }

    /// Select a coupling constraint that shares a kinetic chain with
    /// the primary or secondary action.
    ///
    /// This is Patch 1 (Coupling Constraint) — prevents parallel
    /// generation + skeletal fusion attacks.
    fn select_coupling_constraint(
        &mut self,
        primary: &ChallengeAction,
        secondary: &ChallengeAction,
    ) -> ChallengeAction {
        // Coupling constraint options:
        // - If primary involves arm → torso constraint shares spinal chain
        // - If secondary involves arm → torso constraint
        // - Otherwise → head stabilization (shares with torso)

        let arm_joints = [
            Joint::RightHand,
            Joint::RightElbow,
            Joint::RightShoulder,
            Joint::LeftHand,
            Joint::LeftElbow,
            Joint::LeftShoulder,
        ];

        let primary_is_arm = arm_joints.contains(&primary.joint);
        let secondary_is_arm = arm_joints.contains(&secondary.joint);

        if primary_is_arm || secondary_is_arm {
            // Arm motion → torso tilt couples through spinal kinetic chain
            let tilt_directions = [10.0, -10.0, 12.0, -12.0, 15.0, -8.0];
            let angle = *tilt_directions.choose(&mut self.rng).unwrap();

            ChallengeAction {
                action_type: ActionType::Constraint,
                joint: Joint::Torso,
                motion: MotionType::Tilt,
                direction: None,
                amplitude: None,
                angle_deg: Some(angle),
            }
        } else {
            // Non-arm primary → head stabilization constraint
            ChallengeAction {
                action_type: ActionType::Constraint,
                joint: Joint::Head,
                motion: MotionType::KeepStill,
                direction: None,
                amplitude: None,
                angle_deg: None,
            }
        }
    }

    /// Generate a random perturbation description.
    fn random_perturbation(&mut self) -> String {
        let pause_ms = self.rng.gen_range(50..=200);
        let speed_change_pct: i32 = self.rng.gen_range(-20..=20);
        format!(
            "random_pause_{}ms,speed_change_{}pct",
            pause_ms, speed_change_pct
        )
    }

    /// HMAC the challenge using SHA-256(session_key || challenge_data).
    fn hmac_challenge(&self, challenge: &Challenge) -> Vec<u8> {
        let mut hasher = Sha256::new();
        hasher.update(&self.session_key);
        hasher.update(challenge.challenge_id.as_bytes());
        hasher.update(challenge.timestamp.to_le_bytes());
        hasher.update(challenge.duration_ms.to_le_bytes());
        hasher.update(&challenge.nonce);
        // Hash actions deterministically
        for action in &challenge.actions {
            hasher.update(serde_json::to_string(action).unwrap_or_default());
        }
        hasher.finalize().to_vec()
    }

    /// Verify a challenge token (used by the verification node).
    pub fn verify_token(&self, challenge: &Challenge, token: &[u8]) -> bool {
        let expected = self.hmac_challenge(challenge);
        // Constant-time comparison
        if expected.len() != token.len() {
            return false;
        }
        expected
            .iter()
            .zip(token.iter())
            .fold(0u8, |acc, (a, b)| acc | (a ^ b))
            == 0
    }
}

/// Get current Unix timestamp in seconds.
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

    #[test]
    fn test_generates_valid_challenge() {
        let key = vec![0u8; 32];
        let mut gen = ChallengeGenerator::new(key);
        let challenge = gen.generate();

        // Must have at least 3 actions (primary + secondary + constraint)
        assert!(challenge.actions.len() >= 3);

        // Must have exactly one coupling constraint
        let constraints: Vec<_> = challenge
            .actions
            .iter()
            .filter(|a| a.action_type == ActionType::Constraint)
            .collect();
        assert_eq!(constraints.len(), 1);

        // Must have valid timing
        assert_eq!(challenge.timing.start_window_ms, 100);
        assert!(challenge.duration_ms >= 3000);

        // Must have a non-empty challenge token
        assert!(!challenge.challenge_token.is_empty());

        // Token must verify
        assert!(gen.verify_token(&challenge, &challenge.challenge_token.clone()));
    }

    #[test]
    fn test_challenges_are_unique() {
        let key = vec![0u8; 32];
        let mut gen = ChallengeGenerator::new(key);
        let c1 = gen.generate();
        let c2 = gen.generate();

        assert_ne!(c1.challenge_id, c2.challenge_id);
        assert_ne!(c1.nonce, c2.nonce);
        assert_ne!(c1.challenge_token, c2.challenge_token);
    }

    #[test]
    fn test_token_verification_rejects_tampered() {
        let key = vec![0u8; 32];
        let mut gen = ChallengeGenerator::new(key);
        let mut challenge = gen.generate();

        // Tamper with the challenge
        challenge.duration_ms += 100;

        assert!(!gen.verify_token(&challenge, &challenge.challenge_token));
    }

    #[test]
    fn test_coupling_constraint_present() {
        let key = vec![0u8; 32];
        let mut gen = ChallengeGenerator::new(key);

        for _ in 0..50 {
            let challenge = gen.generate();
            let has_constraint = challenge.actions.iter().any(|a| {
                a.action_type == ActionType::Constraint
                    && (a.motion == MotionType::Tilt || a.motion == MotionType::KeepStill)
            });
            assert!(has_constraint, "Every challenge must have a coupling constraint");
        }
    }
}
