// Verification module — Multi-Factor Presence Scoring.
//
// Combines Motion Signature, Device Attestation, and Context factors
// into a single Presence Score. Implements D stage MVP subset.
//
// Corresponds to: Multi-Factor Formalization §1–2, MVP spec §4–7.

pub mod scorer;

pub use scorer::PresenceScorer;
