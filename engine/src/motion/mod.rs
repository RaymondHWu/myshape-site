// Motion Signature Engine — MVP implementation.
//
// Extracts four feature dimensions from motion data:
//   - Kinematics (K): skeletal ratios, joint angle statistics
//   - Acceleration (A): distributional properties per keypoint
//   - Jerk (J): third-derivative dynamics
//   - Jerk Spectrum (J_spec): frequency-domain jerk analysis
//
// Composes features into a 128-dimensional Motion Signature vector.
//
// Corresponds to: Motion Signature Formalization §1, MVP spec §3.

pub mod kinematics;
pub mod dynamics;
pub mod spectral;
pub mod signature;

pub use signature::MotionSignatureEngine;
