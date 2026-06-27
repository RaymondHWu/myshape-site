/**
 * Type bridge — re-exports MyShape WASM SDK types for src/-scoped imports.
 *
 * The WASM SDK lives in wasm/ (outside src/), so TypeScript can't resolve
 * direct imports. This file mirrors the SDK's exported types so hooks and
 * components inside src/ can reference them without path issues.
 */

// Mirror of MyShapeBrowserSDK's public interface
export interface MyShapeEngine {
  generateChallenge(): Challenge;
  extractSignature(motion: MotionSequence): MotionSignature;
  similarity(enrollment: MotionSignature, response: MotionSignature): number;
  createEnrollment(signatures: MotionSignature[], userId: string, device: DeviceInfo): Enrollment;
  verifyIntent(challenge: Challenge, motionSequence: MotionSequence, context: VerifyIntentContext, enrollment: Enrollment): VerificationResult;
  generateHumanMotion(durationS?: number, fps?: number, amplitude?: number): MotionSequence;
  generateAIMotion(durationS?: number, fps?: number, amplitude?: number): MotionSequence;
}

// ── Mirrored types from wasm/myshape-sdk.ts ──

export interface Keypoint { x: number; y: number; z: number; }
export interface PoseFrame { t: number; keypoints: Keypoint[]; }
export interface MotionSequence { fps: number; frames: PoseFrame[]; }
export interface ImuSample { t: number; accel: [number, number, number]; gyro: [number, number, number]; }
export interface ImuSequence { sample_rate_hz: number; samples: ImuSample[]; }
export interface DeviceInfo { os: string; model: string; device_id: string; is_rooted: boolean; imu_sample_rate_hz?: number; }
export interface LocationInfo { latitude: number; longitude: number; timestamp: number; }
export interface ChallengeAction { action_type: 'primary' | 'secondary' | 'constraint'; joint: string; motion: string; direction?: string; amplitude?: string; angle_deg?: number; }
export interface TimingConstraints { start_window_ms: number; hold_ms?: number; perturbation?: string; }
export interface Challenge { challenge_id: string; timestamp: number; duration_ms: number; actions: ChallengeAction[]; timing: TimingConstraints; nonce: number[]; challenge_token: number[]; }
export interface MotionSignature { vector: number[]; version: number; }
export interface Enrollment { user_id: string; signature: MotionSignature; variance: number; sample_count: number; enrolled_at: number; device_info: DeviceInfo; }
export interface ChallengeResponse { challenge_id: string; user_id: string; pose_sequence: MotionSequence; imu_sequence: ImuSequence; device_info: DeviceInfo; location?: LocationInfo; }
export interface FactorScores { motion: number; device: number; context: number; }
export interface VerificationResult { verified: boolean; presence_score: number; factors: FactorScores; risk_level: string; threshold: number; rejection_reason?: string; }
export interface VerifyIntentContext { device: DeviceInfo; location?: LocationInfo; risk_level?: 'low' | 'medium' | 'high'; }
