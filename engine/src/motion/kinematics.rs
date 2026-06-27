// Kinematics features Φ_K.
//
// Extracts:
//   - Skeletal ratios (bone length proportions) — 14 dims
//   - Joint angle range of motion — 6 dims
//   - Velocity statistics per keypoint — 10 dims (5 keypoints × 2 stats)
//   - Acceleration range statistics — 10 dims (5 keypoints × 2 stats)
//
// Output: 40-dimensional feature vector (MVP subset of full 128-dim Φ_K).

use crate::types::MotionSequence;
use nalgebra::DVector;

/// Number of keypoints in standard MediaPipe topology.
const N_KEYPOINTS: usize = 33;

/// Bone connections for skeletal ratio computation.
/// Each tuple is (proximal_joint, distal_joint).
const BONES: &[(usize, usize)] = &[
    // Torso
    (11, 12), // left shoulder → right shoulder
    (11, 23), // left shoulder → left hip
    (12, 24), // right shoulder → right hip
    (23, 24), // left hip → right hip
    // Right arm
    (12, 14), // right shoulder → right elbow
    (14, 16), // right elbow → right wrist
    // Left arm
    (11, 13), // left shoulder → left elbow
    (13, 15), // left elbow → left wrist
    // Right leg
    (24, 26), // right hip → right knee
    (26, 28), // right knee → right ankle
    // Left leg
    (23, 25), // left hip → left knee
    (25, 27), // left knee → left ankle
    // Spine
    (0, 11),  // nose → left shoulder (head size proxy)
    (0, 12),  // nose → right shoulder
];

/// Reference segment for ratio normalization (spine: mid-shoulder → mid-hip).
const REF_PROXIMAL: usize = 11; // left shoulder
const REF_DISTAL: usize = 23;   // left hip

/// Extract kinematics features from a motion sequence.
///
/// Returns a 32-dimensional vector:
///   [0..14]:  14 skeletal ratios
///   [14..20]: 6 joint angle variance features (shoulder, elbow, hip, knee — L+R)
///   [20..26]: 6 velocity statistics (mean/std for 3 keypoints: wrist, ankle, head)
///   [26..32]: 6 acceleration range statistics
pub fn extract_kinematics(sequence: &MotionSequence) -> DVector<f32> {
    let n_frames = sequence.frames.len();
    if n_frames < 2 {
        return DVector::zeros(40);
    }

    // 1. Skeletal ratios (mean across frames for stability)
    let mut ratios = vec![0.0f32; BONES.len()];

    for frame in &sequence.frames {
        if frame.keypoints.len() < N_KEYPOINTS {
            continue;
        }
        let ref_len = distance(
            &frame.keypoints[REF_PROXIMAL],
            &frame.keypoints[REF_DISTAL],
        );
        if ref_len < 1e-6 {
            continue;
        }
        for (i, &(p, d)) in BONES.iter().enumerate() {
            if p < frame.keypoints.len() && d < frame.keypoints.len() {
                ratios[i] += distance(&frame.keypoints[p], &frame.keypoints[d]) / ref_len;
            }
        }
    }
    for r in &mut ratios {
        *r /= n_frames as f32;
    }

    // 2. Joint angle variances
    let angle_pairs = [
        (12, 14, 16), // right shoulder-elbow-wrist
        (11, 13, 15), // left shoulder-elbow-wrist
        (24, 26, 28), // right hip-knee-ankle
        (23, 25, 27), // left hip-knee-ankle
        (14, 12, 24), // right elbow-shoulder-hip
        (13, 11, 23), // left elbow-shoulder-hip
    ];

    let mut angle_variances = vec![0.0f32; angle_pairs.len()];
    let mut angle_sequences: Vec<Vec<f32>> = vec![Vec::new(); angle_pairs.len()];

    for frame in &sequence.frames {
        if frame.keypoints.len() < 29 {
            continue;
        }
        for (i, &(a, b, c)) in angle_pairs.iter().enumerate() {
            if let Some(angle) = joint_angle(&frame.keypoints[a], &frame.keypoints[b], &frame.keypoints[c])
            {
                angle_sequences[i].push(angle);
            }
        }
    }

    for (i, seq) in angle_sequences.iter().enumerate() {
        if seq.len() > 1 {
            let mean: f32 = seq.iter().sum::<f32>() / seq.len() as f32;
            let var: f32 = seq.iter().map(|x| (x - mean) * (x - mean)).sum::<f32>() / seq.len() as f32;
            angle_variances[i] = var;
        }
    }

    // 3. Velocity statistics (mean and std of speed for representative keypoints)
    let rep_keypoints = [15, 16, 27, 28, 0]; // left wrist, right wrist, left ankle, right ankle, nose
    let mut vel_stats = vec![0.0f32; rep_keypoints.len() * 2];

    for (ki, &kp_idx) in rep_keypoints.iter().enumerate() {
        let mut speeds = Vec::with_capacity(n_frames - 1);
        for t in 1..n_frames {
            if kp_idx < sequence.frames[t].keypoints.len()
                && kp_idx < sequence.frames[t - 1].keypoints.len()
            {
                let dt = sequence.frames[t].t - sequence.frames[t - 1].t;
                if dt > 0.0 {
                    let d = distance(&sequence.frames[t].keypoints[kp_idx], &sequence.frames[t - 1].keypoints[kp_idx]);
                    speeds.push(d / dt);
                }
            }
        }
        if !speeds.is_empty() {
            let mean: f32 = speeds.iter().sum::<f32>() / speeds.len() as f32;
            let var: f32 = speeds.iter().map(|s| (s - mean) * (s - mean)).sum::<f32>() / speeds.len() as f32;
            vel_stats[ki * 2] = mean;
            vel_stats[ki * 2 + 1] = var.sqrt(); // std
        }
    }

    // 4. Acceleration range statistics
    let mut accel_stats = vec![0.0f32; rep_keypoints.len() * 2];
    for (ki, &kp_idx) in rep_keypoints.iter().enumerate() {
        let mut accels = Vec::with_capacity(n_frames.saturating_sub(2));
        for t in 2..n_frames {
            if kp_idx < sequence.frames[t].keypoints.len()
                && kp_idx < sequence.frames[t - 1].keypoints.len()
                && kp_idx < sequence.frames[t - 2].keypoints.len()
            {
                let dt1 = sequence.frames[t].t - sequence.frames[t - 1].t;
                let dt2 = sequence.frames[t - 1].t - sequence.frames[t - 2].t;
                if dt1 > 0.0 && dt2 > 0.0 {
                    let v1 = displacement(&sequence.frames[t].keypoints[kp_idx], &sequence.frames[t - 1].keypoints[kp_idx]) / dt1;
                    let v0 = displacement(&sequence.frames[t - 1].keypoints[kp_idx], &sequence.frames[t - 2].keypoints[kp_idx]) / dt2;
                    accels.push((v1 - v0) / ((dt1 + dt2) / 2.0));
                }
            }
        }
        if !accels.is_empty() {
            let mean: f32 = accels.iter().sum::<f32>() / accels.len() as f32;
            let var: f32 = accels.iter().map(|a| (a - mean) * (a - mean)).sum::<f32>() / accels.len() as f32;
            accel_stats[ki * 2] = mean;
            accel_stats[ki * 2 + 1] = var.sqrt();
        }
    }

    // Compose 40-dim vector
    let mut features = Vec::with_capacity(40);
    features.extend_from_slice(&ratios);
    features.extend_from_slice(&angle_variances);
    features.extend_from_slice(&vel_stats);
    features.extend_from_slice(&accel_stats);

    DVector::from_vec(features)
}

/// Euclidean distance between two keypoints.
fn distance(a: &crate::types::Keypoint, b: &crate::types::Keypoint) -> f32 {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    let dz = a.z - b.z;
    (dx * dx + dy * dy + dz * dz).sqrt()
}

/// Displacement vector magnitude between two keypoints.
fn displacement(a: &crate::types::Keypoint, b: &crate::types::Keypoint) -> f32 {
    distance(a, b)
}

/// Compute the angle ABC (in radians) formed by three keypoints.
fn joint_angle(
    a: &crate::types::Keypoint,
    b: &crate::types::Keypoint,
    c: &crate::types::Keypoint,
) -> Option<f32> {
    let ba = [a.x - b.x, a.y - b.y, a.z - b.z];
    let bc = [c.x - b.x, c.y - b.y, c.z - b.z];

    let dot = ba[0] * bc[0] + ba[1] * bc[1] + ba[2] * bc[2];
    let mag_ba = (ba[0] * ba[0] + ba[1] * ba[1] + ba[2] * ba[2]).sqrt();
    let mag_bc = (bc[0] * bc[0] + bc[1] * bc[1] + bc[2] * bc[2]).sqrt();

    if mag_ba < 1e-6 || mag_bc < 1e-6 {
        return None;
    }

    let cos_angle = (dot / (mag_ba * mag_bc)).clamp(-1.0, 1.0);
    Some(cos_angle.acos())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{Keypoint, PoseFrame};

    fn make_frame(t: f32, x: f32, y: f32, z: f32) -> PoseFrame {
        let mut kps = vec![
            Keypoint { x: 0.0, y: 0.0, z: 0.0 }; 33
        ];
        // Set right wrist (16) position to vary
        kps[16] = Keypoint { x: 0.5 + x, y: 0.5 + y, z };
        // Set left wrist (15) to vary — velocity stat index 20 uses kp_idx 15
        kps[15] = Keypoint { x: -0.3 + x, y: 0.5 + y, z };
        // Reference points
        kps[11] = Keypoint { x: 0.3, y: 0.6, z: 0.0 }; // left shoulder
        kps[23] = Keypoint { x: 0.3, y: 0.3, z: 0.0 }; // left hip
        PoseFrame { t, keypoints: kps }
    }

    #[test]
    fn test_extract_kinematics_non_empty() {
        let frames = vec![
            make_frame(0.0, 0.0, 0.0, 0.0),
            make_frame(1.0 / 30.0, 0.05, 0.02, 0.01),
            make_frame(2.0 / 30.0, 0.10, 0.05, 0.01),
        ];
        let seq = MotionSequence { fps: 30, frames };
        let features = extract_kinematics(&seq);
        assert_eq!(features.len(), 40);
        // Should have non-zero velocity stats
        let vel_mean = features[20]; // right wrist velocity mean
        assert!(vel_mean > 0.0, "Velocity should be non-zero for moving keypoints");
    }
}
