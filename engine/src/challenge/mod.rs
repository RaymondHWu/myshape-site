// Challenge module — MVP Challenge Protocol implementation.
//
// Corresponds to: Challenge Protocol Formalization §1–2, MVP spec §2.
//
// Generates unpredictable, multi-action challenges with
// mandatory coupling constraints and timing perturbations.

pub mod generator;

pub use generator::ChallengeGenerator;
