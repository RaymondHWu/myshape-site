// Dynamics features: Acceleration Φ_A and Jerk Φ_J.
//
// Φ_A: Per-keypoint acceleration distributional properties
//   - Mean, std, skewness, kurtosis, Hurst exponent (5 stats × 5 keypoints = 25-dim)
//
// Φ_J: Per-keypoint jerk distributional properties
//   - Mean, std, skewness, MAD, lag-1 autocorrelation (5 stats × 5 keypoints = 25-dim)
//
// Total output: 50 dimensions (25 Φ_A + 25 Φ_J).
// MVP subset of the full dynamics pipeline.

use crate::types::MotionSequence;
use nalgebra::DVector;

/// Representative keypoints for dynamics analysis.
const REP_KEYPOINTS: &[usize] = &[15, 16, 27, 28, 0]; // left wrist, right wrist, left ankle, right ankle, nose

/// Extract combined acceleration + jerk features.
/// Returns 50-dimensional vector: [0..25] Φ_A, [25..50] Φ_J.
pub fn extract_dynamics(sequence: &MotionSequence) -> DVector<f32> {
    let accel_features = extract_acceleration(sequence);
    let jerk_features = extract_jerk(sequence);

    let mut combined = Vec::with_capacity(50);
    combined.extend_from_slice(accel_features.as_slice());
    combined.extend_from_slice(jerk_features.as_slice());
    DVector::from_vec(combined)
}

/// Extract Φ_A: acceleration profile features (25-dim).
///
/// For each representative keypoint, computes:
///   - mean: average acceleration magnitude
///   - std: standard deviation
///   - skewness: asymmetry of distribution
///   - kurtosis: tail heaviness
///   - hurst: Hurst exponent (long-range dependence, 0 < H < 1)
///
/// Human acceleration: H ≈ 0.6–0.8 (persistent, long-memory).
/// AI-generated acceleration: H ≈ 0.5 (white noise after smoothing) or H ≈ 0.3–0.4.
pub fn extract_acceleration(sequence: &MotionSequence) -> DVector<f32> {
    let n_frames = sequence.frames.len();
    if n_frames < 4 {
        return DVector::zeros(25);
    }

    let mut features = Vec::with_capacity(25);

    for &kp_idx in REP_KEYPOINTS {
        // Compute acceleration magnitudes across frames
        let accel_magnitudes = compute_accel_magnitudes(sequence, kp_idx);

        if accel_magnitudes.len() < 3 {
            features.extend_from_slice(&[0.0f32; 5]);
            continue;
        }

        let n = accel_magnitudes.len() as f32;
        let mean: f32 = accel_magnitudes.iter().sum::<f32>() / n;
        let var: f32 = accel_magnitudes.iter().map(|a| (a - mean).powi(2)).sum::<f32>() / n;
        let std = var.sqrt();

        // Skewness
        let skew = if std > 1e-8 {
            accel_magnitudes.iter()
                .map(|a| ((a - mean) / std).powi(3))
                .sum::<f32>() / n
        } else {
            0.0
        };

        // Excess kurtosis
        let kurt = if std > 1e-8 {
            accel_magnitudes.iter()
                .map(|a| ((a - mean) / std).powi(4))
                .sum::<f32>() / n - 3.0
        } else {
            0.0
        };

        // Hurst exponent (simplified R/S method for MVP)
        let hurst = compute_hurst(&accel_magnitudes);

        features.extend_from_slice(&[mean, std, skew, kurt, hurst]);
    }

    DVector::from_vec(features)
}

/// Extract Φ_J: jerk profile features (25-dim).
///
/// For each representative keypoint, computes:
///   - mean: average jerk magnitude
///   - std: standard deviation
///   - skewness: asymmetry
///   - mad: median absolute deviation (robust to outliers)
///   - rho: lag-1 autocorrelation of jerk magnitude
///
/// Jerk is the most unforgeable kinematic dimension (FRI = 7 in internal assessment).
pub fn extract_jerk(sequence: &MotionSequence) -> DVector<f32> {
    let n_frames = sequence.frames.len();
    if n_frames < 5 {
        return DVector::zeros(25);
    }

    let mut features = Vec::with_capacity(25);

    for &kp_idx in REP_KEYPOINTS {
        let jerk_magnitudes = compute_jerk_magnitudes(sequence, kp_idx);

        if jerk_magnitudes.len() < 3 {
            features.extend_from_slice(&[0.0f32; 5]);
            continue;
        }

        let n = jerk_magnitudes.len() as f32;
        let mean: f32 = jerk_magnitudes.iter().sum::<f32>() / n;
        let var: f32 = jerk_magnitudes.iter().map(|j| (j - mean).powi(2)).sum::<f32>() / n;
        let std = var.sqrt();

        // Skewness
        let skew = if std > 1e-8 {
            jerk_magnitudes.iter()
                .map(|j| ((j - mean) / std).powi(3))
                .sum::<f32>() / n
        } else {
            0.0
        };

        // Median Absolute Deviation (robust scale estimator)
        let mut sorted: Vec<f32> = jerk_magnitudes.iter().copied().collect();
        sorted.sort_unstable_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        let median = if sorted.len() % 2 == 0 {
            (sorted[sorted.len() / 2 - 1] + sorted[sorted.len() / 2]) / 2.0
        } else {
            sorted[sorted.len() / 2]
        };
        let abs_devs: Vec<f32> = jerk_magnitudes.iter().map(|j| (j - median).abs()).collect();
        let mut sorted_devs: Vec<f32> = abs_devs.iter().copied().collect();
        sorted_devs.sort_unstable_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        let mad = if sorted_devs.len() % 2 == 0 {
            (sorted_devs[sorted_devs.len() / 2 - 1] + sorted_devs[sorted_devs.len() / 2]) / 2.0
        } else {
            sorted_devs[sorted_devs.len() / 2]
        } * 1.4826; // scale factor for normal consistency

        // Lag-1 autocorrelation
        let rho = if jerk_magnitudes.len() >= 2 {
            let m_curr: f32 = jerk_magnitudes[..jerk_magnitudes.len() - 1].iter().sum::<f32>()
                / (jerk_magnitudes.len() - 1) as f32;
            let m_lag: f32 = jerk_magnitudes[1..].iter().sum::<f32>()
                / (jerk_magnitudes.len() - 1) as f32;
            let s_curr: f32 = jerk_magnitudes[..jerk_magnitudes.len() - 1]
                .iter()
                .map(|j| (j - m_curr).powi(2))
                .sum::<f32>()
                / (jerk_magnitudes.len() - 1) as f32;
            let s_lag: f32 = jerk_magnitudes[1..]
                .iter()
                .map(|j| (j - m_lag).powi(2))
                .sum::<f32>()
                / (jerk_magnitudes.len() - 1) as f32;

            if s_curr.sqrt() * s_lag.sqrt() > 1e-8 {
                let cov: f32 = jerk_magnitudes[..jerk_magnitudes.len() - 1]
                    .iter()
                    .zip(jerk_magnitudes[1..].iter())
                    .map(|(a, b)| (a - m_curr) * (b - m_lag))
                    .sum::<f32>()
                    / (jerk_magnitudes.len() - 1) as f32;
                cov / (s_curr.sqrt() * s_lag.sqrt())
            } else {
                0.0
            }
        } else {
            0.0
        };

        features.extend_from_slice(&[mean, std, skew, mad, rho]);
    }

    DVector::from_vec(features)
}

/// Compute acceleration magnitudes for a specific keypoint.
fn compute_accel_magnitudes(sequence: &MotionSequence, kp_idx: usize) -> Vec<f32> {
    let mut magnitudes = Vec::new();
    let n = sequence.frames.len();

    // Second central difference for acceleration
    for t in 1..n - 1 {
        if kp_idx >= sequence.frames[t - 1].keypoints.len()
            || kp_idx >= sequence.frames[t].keypoints.len()
            || kp_idx >= sequence.frames[t + 1].keypoints.len()
        {
            continue;
        }

        let dt_prev = sequence.frames[t].t - sequence.frames[t - 1].t;
        let dt_next = sequence.frames[t + 1].t - sequence.frames[t].t;
        if dt_prev <= 0.0 || dt_next <= 0.0 {
            continue;
        }

        let prev = &sequence.frames[t - 1].keypoints[kp_idx];
        let curr = &sequence.frames[t].keypoints[kp_idx];
        let next = &sequence.frames[t + 1].keypoints[kp_idx];

        // Velocity at t-0.5 and t+0.5
        let v_back = [
            (curr.x - prev.x) / dt_prev,
            (curr.y - prev.y) / dt_prev,
            (curr.z - prev.z) / dt_prev,
        ];
        let v_fwd = [
            (next.x - curr.x) / dt_next,
            (next.y - curr.y) / dt_next,
            (next.z - curr.z) / dt_next,
        ];

        // Acceleration at t
        let dt_mid = (dt_prev + dt_next) / 2.0;
        let ax = (v_fwd[0] - v_back[0]) / dt_mid;
        let ay = (v_fwd[1] - v_back[1]) / dt_mid;
        let az = (v_fwd[2] - v_back[2]) / dt_mid;

        magnitudes.push((ax * ax + ay * ay + az * az).sqrt());
    }

    magnitudes
}

/// Compute jerk magnitudes for a specific keypoint.
fn compute_jerk_magnitudes(sequence: &MotionSequence, kp_idx: usize) -> Vec<f32> {
    let accel_mags = compute_accel_magnitudes(sequence, kp_idx);
    if accel_mags.len() < 2 {
        return Vec::new();
    }

    // Jerk is the derivative of acceleration
    // Using forward difference for simplicity
    let mut jerk_mags = Vec::with_capacity(accel_mags.len() - 1);
    for i in 1..accel_mags.len() {
        // Assume uniform time step (≈ 1/fps)
        let dt = 1.0 / sequence.fps as f32;
        let jerk = (accel_mags[i] - accel_mags[i - 1]) / dt;
        jerk_mags.push(jerk.abs());
    }

    jerk_mags
}

/// Simplified Hurst exponent computation using R/S method.
///
/// Divides the series into windows, computes rescaled range,
/// and estimates H from the log-log slope.
fn compute_hurst(data: &[f32]) -> f32 {
    let n = data.len();
    if n < 8 {
        return 0.5; // default for insufficient data
    }

    // Use a single window size for MVP (approx sqrt(n))
    let window = (n as f32).sqrt() as usize;
    if window < 4 || window > n / 4 {
        return 0.5;
    }

    let mean: f32 = data.iter().sum::<f32>() / n as f32;

    // Compute cumulative deviations
    let mut cum_dev = vec![0.0f32; n];
    let mut running = 0.0f32;
    for (i, &val) in data.iter().enumerate() {
        running += val - mean;
        cum_dev[i] = running;
    }

    let r = cum_dev.iter().cloned().fold(f32::NEG_INFINITY, f32::max)
        - cum_dev.iter().cloned().fold(f32::INFINITY, f32::min);
    let s = (data.iter().map(|d| (d - mean).powi(2)).sum::<f32>() / n as f32).sqrt();

    if s < 1e-8 {
        return 0.5;
    }

    let rs = r / s;

    // H ≈ log(R/S) / log(window)
    let h = (rs.ln()) / (window as f32).ln();

    // Clamp to valid range
    h.clamp(0.0, 1.0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Keypoint, PoseFrame};

    fn make_frames() -> Vec<PoseFrame> {
        let mut frames = Vec::new();
        for i in 0..30 {
            let t = i as f32 / 30.0;
            let mut kps = vec![Keypoint { x: 0.0, y: 0.0, z: 0.0 }; 33];
            // Simulate a moving right wrist
            let phase = t * 2.0 * std::f32::consts::PI;
            kps[16] = Keypoint {
                x: 0.5 + 0.1 * phase.sin(),
                y: 0.5 + 0.1 * phase.cos(),
                z: 0.0,
            };
            kps[11] = Keypoint { x: 0.3, y: 0.6, z: 0.0 };
            kps[23] = Keypoint { x: 0.3, y: 0.3, z: 0.0 };
            frames.push(PoseFrame { t, keypoints: kps });
        }
        frames
    }

    #[test]
    fn test_extract_dynamics_dimensions() {
        let seq = MotionSequence {
            fps: 30,
            frames: make_frames(),
        };
        let features = extract_dynamics(&seq);
        assert_eq!(features.len(), 50);

        // Φ_A should be first 25, Φ_J last 25
        let accel_part = DVector::from_vec(features.as_slice()[..25].to_vec());
        let jerk_part = DVector::from_vec(features.as_slice()[25..].to_vec());

        assert_eq!(accel_part.len(), 25);
        assert_eq!(jerk_part.len(), 25);
    }

    #[test]
    fn test_hurst_range() {
        let data: Vec<f32> = (0..100).map(|i| (i as f32 * 0.1).sin()).collect();
        let h = compute_hurst(&data);
        assert!(h >= 0.0 && h <= 1.0, "Hurst exponent must be in [0, 1], got {}", h);
    }

    #[test]
    fn test_empty_sequence() {
        let seq = MotionSequence {
            fps: 30,
            frames: vec![],
        };
        let features = extract_dynamics(&seq);
        assert_eq!(features.len(), 50);
        assert!(features.iter().all(|&f| f == 0.0));
    }
}
