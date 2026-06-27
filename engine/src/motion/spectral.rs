// Spectral features: Jerk Spectrum Φ_Jspec.
//
// Computes the frequency-domain representation of jerk for representative
// keypoints. This is the strongest single-feature AI discriminator
// (Patch 2: Jerk Spectrum as first-class citizen).
//
// Extracts energy in frequency bands + spectral slope + spectral entropy.
// Output: 30 dimensions (6 stats × 5 keypoints).

use crate::types::MotionSequence;
use nalgebra::DVector;
use rustfft::{FftPlanner, num_complex::Complex32};

/// Representative keypoints for spectral analysis.
const REP_KEYPOINTS: &[usize] = &[15, 16, 27, 28, 0];

/// Frequency bands for energy computation (Hz).
const BANDS: &[(f32, f32)] = &[
    (1.0, 3.0),    // Low-frequency control
    (3.0, 8.0),    // Mid-frequency dynamics
    (8.0, 15.0),   // High-frequency — human jerk structure lives here
    (15.0, 30.0),  // Above physiological tremor Nyquist
];

/// Extract jerk spectrum features (30-dim).
///
/// For each representative keypoint, computes:
///   - Energy in 4 frequency bands
///   - Spectral slope (log-log power vs frequency)
///   - Spectral entropy
///
/// Total: 6 stats × 5 keypoints = 30 dimensions.
pub fn extract_jerk_spectrum(sequence: &MotionSequence) -> DVector<f32> {
    let n_frames = sequence.frames.len();
    if n_frames < 8 {
        return DVector::zeros(30);
    }

    let fps = sequence.fps as f32;
    let mut features = Vec::with_capacity(30);

    for &kp_idx in REP_KEYPOINTS {
        // Compute jerk time series for this keypoint
        let jerk_series = compute_jerk_series(sequence, kp_idx);
        let n = jerk_series.len();

        if n < 8 {
            features.extend_from_slice(&[0.0f32; 6]);
            continue;
        }

        // Zero-pad to next power of 2 for FFT efficiency
        let fft_size = n.next_power_of_two();
        let mut fft_input: Vec<Complex32> = jerk_series
            .iter()
            .map(|&j| Complex32::new(j, 0.0))
            .collect();
        fft_input.resize(fft_size, Complex32::new(0.0, 0.0));

        // Apply Hann window
        for (i, sample) in fft_input.iter_mut().enumerate().take(n) {
            let window = 0.5 * (1.0 - (2.0 * std::f32::consts::PI * i as f32 / n as f32).cos());
            *sample = Complex32::new(sample.re * window, 0.0);
        }

        // Forward FFT
        let mut planner = FftPlanner::new();
        let fft = planner.plan_fft_forward(fft_size);
        fft.process(&mut fft_input);

        // Power spectrum (only positive frequencies up to Nyquist)
        let nyquist_idx = fft_size / 2;
        let freq_resolution = fps / fft_size as f32;
        let power: Vec<f32> = fft_input[..nyquist_idx]
            .iter()
            .map(|c| c.norm_sqr() / n as f32)
            .collect();

        // 1. Band energies
        let mut band_energies = [0.0f32; 4];
        for (i, sample) in power.iter().enumerate() {
            let freq = i as f32 * freq_resolution;
            for (bi, &(lo, hi)) in BANDS.iter().enumerate() {
                if freq >= lo && freq < hi {
                    band_energies[bi] += sample * freq_resolution;
                }
            }
        }
        // Normalize by total energy
        let total_energy: f32 = band_energies.iter().sum();
        if total_energy > 1e-8 {
            for e in &mut band_energies {
                *e /= total_energy;
            }
        }

        // 2. Spectral slope (log-log linear fit)
        let spectral_slope = compute_spectral_slope(&power, freq_resolution);

        // 3. Spectral entropy
        let spectral_entropy = compute_spectral_entropy(&power);

        features.extend_from_slice(&band_energies);
        features.push(spectral_slope);
        features.push(spectral_entropy);
    }

    DVector::from_vec(features)
}

/// Extract the jerk time series for a specific keypoint.
fn compute_jerk_series(sequence: &MotionSequence, kp_idx: usize) -> Vec<f32> {
    let n = sequence.frames.len();
    if n < 5 || kp_idx >= sequence.frames[0].keypoints.len() {
        return Vec::new();
    }

    // Compute acceleration first
    let mut accel_mags = Vec::with_capacity(n - 2);
    for t in 1..n - 1 {
        let dt_prev = sequence.frames[t].t - sequence.frames[t - 1].t;
        let dt_next = sequence.frames[t + 1].t - sequence.frames[t].t;
        if dt_prev <= 0.0 || dt_next <= 0.0 {
            continue;
        }
        let prev = &sequence.frames[t - 1].keypoints[kp_idx];
        let curr = &sequence.frames[t].keypoints[kp_idx];
        let next = &sequence.frames[t + 1].keypoints[kp_idx];

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
        let dt_mid = (dt_prev + dt_next) / 2.0;
        let ax = (v_fwd[0] - v_back[0]) / dt_mid;
        let ay = (v_fwd[1] - v_back[1]) / dt_mid;
        let az = (v_fwd[2] - v_back[2]) / dt_mid;

        accel_mags.push((ax * ax + ay * ay + az * az).sqrt());
    }

    // Jerk = derivative of acceleration
    let mut jerk_series = Vec::with_capacity(accel_mags.len().saturating_sub(1));
    for i in 1..accel_mags.len() {
        let dt = 1.0 / sequence.fps as f32;
        jerk_series.push((accel_mags[i] - accel_mags[i - 1]) / dt);
    }

    jerk_series
}

/// Compute spectral slope via log-log linear regression.
///
/// Human jerk spectrum exhibits 1/f^α scaling with α ≈ 1.0–1.5 in 1-15 Hz.
/// AI jerk spectrum shows α > 2.0 (over-smoothed) or α ≈ 0 (white noise).
fn compute_spectral_slope(power: &[f32], freq_resolution: f32) -> f32 {
    let n = power.len();
    if n < 4 {
        return 0.0;
    }

    // Use frequency range 1-15 Hz for slope estimation
    let mut log_freqs = Vec::new();
    let mut log_powers = Vec::new();

    for (i, &p) in power.iter().enumerate() {
        let freq = i as f32 * freq_resolution;
        if freq >= 1.0 && freq <= 15.0 && p > 1e-10 {
            log_freqs.push(freq.ln());
            log_powers.push(p.ln());
        }
    }

    if log_freqs.len() < 3 {
        return 0.0;
    }

    let n_pts = log_freqs.len() as f32;
    let mean_f: f32 = log_freqs.iter().sum::<f32>() / n_pts;
    let mean_p: f32 = log_powers.iter().sum::<f32>() / n_pts;

    let cov: f32 = log_freqs.iter()
        .zip(log_powers.iter())
        .map(|(f, p)| (f - mean_f) * (p - mean_p))
        .sum();
    let var_f: f32 = log_freqs.iter()
        .map(|f| (f - mean_f).powi(2))
        .sum();

    if var_f < 1e-8 {
        return 0.0;
    }

    // Slope = Δlog(P) / Δlog(f) ≈ -α
    -cov / var_f
}

/// Compute spectral entropy: -∫ p(f) log p(f) df.
///
/// Human jerk spectrum: moderate entropy (structured, multi-scale).
/// AI jerk spectrum: low entropy (over-smoothed) or high entropy (white noise).
fn compute_spectral_entropy(power: &[f32]) -> f32 {
    let total: f32 = power.iter().sum();
    if total < 1e-10 {
        return 0.0;
    }

    let mut entropy = 0.0f32;
    for &p in power {
        let prob = p / total;
        if prob > 1e-10 {
            entropy -= prob * prob.log2();
        }
    }

    entropy
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Keypoint, PoseFrame};

    fn make_sequence(n_frames: usize) -> MotionSequence {
        let mut frames = Vec::with_capacity(n_frames);
        for i in 0..n_frames {
            let t = i as f32 / 30.0;
            let mut kps = vec![Keypoint { x: 0.0, y: 0.0, z: 0.0 }; 33];
            // Sinusoidal motion with micro-perturbation (simulating natural motion)
            let phase = t * 2.0 * std::f32::consts::PI;
            kps[16] = Keypoint {
                x: 0.5 + 0.1 * phase.sin() + 0.002 * (t * 50.0).sin(),
                y: 0.5 + 0.1 * phase.cos() + 0.002 * (t * 37.0).cos(),
                z: 0.001 * (t * 60.0).sin(),
            };
            kps[11] = Keypoint { x: 0.3, y: 0.6, z: 0.0 };
            kps[23] = Keypoint { x: 0.3, y: 0.3, z: 0.0 };
            frames.push(PoseFrame { t, keypoints: kps });
        }
        MotionSequence { fps: 30, frames }
    }

    #[test]
    fn test_extract_jerk_spectrum_dimensions() {
        let seq = make_sequence(60); // 2 seconds at 30fps
        let features = extract_jerk_spectrum(&seq);
        assert_eq!(features.len(), 30);
    }

    #[test]
    fn test_spectral_slope_range() {
        // Simulate 1/f^1.5 power spectrum
        let power: Vec<f32> = (1..100)
            .map(|i| (i as f32).powf(-1.5))
            .collect();
        let slope = compute_spectral_slope(&power, 1.0);
        // Slope should be close to -1.5
        assert!(slope > 0.5 && slope < 2.5,
            "Spectral slope should reflect 1/f scaling, got {}", slope);
    }

    #[test]
    fn test_empty_sequence() {
        let seq = MotionSequence { fps: 30, frames: vec![] };
        let features = extract_jerk_spectrum(&seq);
        assert!(features.iter().all(|&f| f == 0.0));
    }
}
