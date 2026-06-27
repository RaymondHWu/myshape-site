/**
 * MyShape Protocol — TypeScript SDK v0.1
 *
 * Lightweight wrapper around the WASM core engine.
 * Exposes a clean, one-call verification interface.
 *
 * Usage:
 *   import { MyShapeSDK } from './myshape-sdk';
 *   const sdk = await MyShapeSDK.init();
 *   const result = await sdk.verifyIntent(challenge, motionSequence, context);
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Type Definitions ─────────────────────────────────────────────────

export interface Keypoint {
  x: number;
  y: number;
  z: number;
}

export interface PoseFrame {
  t: number;
  keypoints: Keypoint[];
}

export interface MotionSequence {
  fps: number;
  frames: PoseFrame[];
}

export interface ImuSample {
  t: number;
  accel: [number, number, number];
  gyro: [number, number, number];
}

export interface ImuSequence {
  sample_rate_hz: number;
  samples: ImuSample[];
}

export interface DeviceInfo {
  os: string;
  model: string;
  device_id: string;
  is_rooted: boolean;
  imu_sample_rate_hz?: number;
}

export interface LocationInfo {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export interface ChallengeAction {
  action_type: 'primary' | 'secondary' | 'constraint';
  joint: string;
  motion: string;
  direction?: string;
  amplitude?: string;
  angle_deg?: number;
}

export interface TimingConstraints {
  start_window_ms: number;
  hold_ms?: number;
  perturbation?: string;
}

export interface Challenge {
  challenge_id: string;
  timestamp: number;
  duration_ms: number;
  actions: ChallengeAction[];
  timing: TimingConstraints;
  nonce: number[];
  challenge_token: number[];
}

export interface MotionSignature {
  vector: number[];
  version: number;
}

export interface Enrollment {
  user_id: string;
  signature: MotionSignature;
  variance: number;
  sample_count: number;
  enrolled_at: number;
  device_info: DeviceInfo;
}

export interface ChallengeResponse {
  challenge_id: string;
  user_id: string;
  pose_sequence: MotionSequence;
  imu_sequence: ImuSequence;
  device_info: DeviceInfo;
  location?: LocationInfo;
}

export interface FactorScores {
  motion: number;
  device: number;
  context: number;
}

export interface VerificationResult {
  verified: boolean;
  presence_score: number;
  factors: FactorScores;
  risk_level: string;
  threshold: number;
  rejection_reason?: string;
}

export interface VerifyIntentContext {
  device: DeviceInfo;
  location?: LocationInfo;
  risk_level?: 'low' | 'medium' | 'high';
}

// ── WASM Module Type ─────────────────────────────────────────────────

interface MyShapeWasm {
  generate_challenge(session_key_hex: string): string;
  extract_signature(motion_json: string): string;
  similarity(enrollment_json: string, response_json: string): number;
  verify_intent(
    enrollment_json: string,
    challenge_json: string,
    response_json: string,
    signature_json: string,
    risk_level: string
  ): string;
  create_enrollment(
    signatures_json: string,
    user_id: string,
    device_json: string
  ): string;
  generate_human_motion(duration_s: number, fps: number, amplitude: number): string;
  generate_ai_motion(duration_s: number, fps: number, amplitude: number): string;
}

// ── SDK Class ────────────────────────────────────────────────────────

export class MyShapeSDK {
  private wasm: MyShapeWasm;
  private sessionKey: Buffer;

  private constructor(wasm: MyShapeWasm, sessionKey: Buffer) {
    this.wasm = wasm;
    this.sessionKey = sessionKey;
  }

  /**
   * Initialize the SDK by loading the WASM module.
   *
   * Looks for the WASM package in:
   *   1. ./pkg/ (local development)
   *   2. ../wasm/pkg/ (from scripts/ directory)
   */
  static async init(): Promise<MyShapeSDK> {
    // Generate a random session key
    const sessionKey = crypto.randomBytes(32);

    // Try multiple paths for the WASM package
    const wasmPaths = [
      path.join(__dirname, 'pkg', 'myshape_wasm.js'),
      path.join(__dirname, '..', 'wasm', 'pkg', 'myshape_wasm.js'),
    ];

    let wasmModule: MyShapeWasm | null = null;
    for (const p of wasmPaths) {
      if (fs.existsSync(p)) {
        wasmModule = await import(p);
        break;
      }
    }

    if (!wasmModule) {
      throw new Error(
        'MyShape WASM module not found. Run `wasm-pack build --target nodejs` in the wasm/ directory.'
      );
    }

    return new MyShapeSDK(wasmModule, sessionKey);
  }

  // ── Core API ────────────────────────────────────────────────────

  /**
   * Generate a new presence verification challenge.
   *
   * @returns A Challenge object with randomized actions and coupling constraints.
   */
  generateChallenge(): Challenge {
    const hex = this.sessionKey.toString('hex');
    const json = this.wasm.generate_challenge(hex);
    return JSON.parse(json) as Challenge;
  }

  /**
   * Extract a Motion Signature from raw motion data.
   *
   * @param motion - The captured motion sequence.
   * @returns A 128-dimensional MotionSignature.
   */
  extractSignature(motion: MotionSequence): MotionSignature {
    const json = this.wasm.extract_signature(JSON.stringify(motion));
    return JSON.parse(json) as MotionSignature;
  }

  /**
   * Compute similarity between two signatures.
   *
   * Uses L2-normalized distance (captures both direction AND magnitude).
   *
   * @returns Score in [0, 1] — 1.0 = identical.
   */
  similarity(enrollment: MotionSignature, response: MotionSignature): number {
    return this.wasm.similarity(
      JSON.stringify(enrollment),
      JSON.stringify(response)
    );
  }

  /**
   * Create an enrollment from multiple motion samples.
   *
   * @param signatures - Array of MotionSignatures (recommended: 20).
   * @param userId - User identifier.
   * @param device - Device info at enrollment time.
   * @returns An Enrollment object for future verification.
   */
  createEnrollment(
    signatures: MotionSignature[],
    userId: string,
    device: DeviceInfo
  ): Enrollment {
    const json = this.wasm.create_enrollment(
      JSON.stringify(signatures),
      userId,
      JSON.stringify(device)
    );
    return JSON.parse(json) as Enrollment;
  }

  /**
   * Verify a challenge response against an enrolled signature.
   *
   * This is the PRIMARY one-call verification interface.
   *
   * @param challenge - The challenge that was issued.
   * @param motionSequence - The captured motion data.
   * @param context - Device info, location, and risk level.
   * @param enrollment - The enrolled user data.
   * @returns VerificationResult with composite score and factor breakdown.
   */
  verifyIntent(
    challenge: Challenge,
    motionSequence: MotionSequence,
    context: VerifyIntentContext,
    enrollment: Enrollment
  ): VerificationResult {
    // Build ChallengeResponse from inputs
    const response: ChallengeResponse = {
      challenge_id: challenge.challenge_id,
      user_id: enrollment.user_id,
      pose_sequence: motionSequence,
      imu_sequence: {
        sample_rate_hz: context.device.imu_sample_rate_hz ?? 200,
        samples: [], // Generated from motion if needed
      },
      device_info: context.device,
      location: context.location,
    };

    // Extract signature directly from motion in one step
    const signature = this.extractSignature(motionSequence);

    const riskLevel = context.risk_level ?? 'medium';

    const resultJson = this.wasm.verify_intent(
      JSON.stringify(enrollment),
      JSON.stringify(challenge),
      JSON.stringify(response),
      JSON.stringify(signature),
      riskLevel
    );

    return JSON.parse(resultJson) as VerificationResult;
  }

  // ── Demo Utilities ───────────────────────────────────────────────

  /**
   * Generate synthetic human-like motion with realistic micro-tremor.
   *
   * Includes: 8-12Hz physiological tremor, 1/f jerk spectrum,
   * micro-kinetic perturbations, natural latency variation.
   *
   * @param durationS - Duration in seconds.
   * @param fps - Frames per second.
   * @param amplitude - Base motion amplitude in meters.
   */
  generateHumanMotion(
    durationS: number = 3.0,
    fps: number = 30,
    amplitude: number = 0.15
  ): MotionSequence {
    const json = this.wasm.generate_human_motion(durationS, fps, amplitude);
    return JSON.parse(json) as MotionSequence;
  }

  /**
   * Generate synthetic AI-forged motion.
   *
   * The AI trajectory looks visually correct but:
   *   - Lacks physiological tremor (missing 8-12Hz band)
   *   - Has over-smoothed jerk spectrum
   *   - Shows excessive temporal regularity
   *   - Lacks micro-kinetic perturbations
   *
   * These defects are invisible to the human eye but detectable
   * by the Motion Signature's deep kinematic analysis.
   *
   * @param durationS - Duration in seconds.
   * @param fps - Frames per second.
   * @param amplitude - Base motion amplitude in meters.
   */
  generateAIMotion(
    durationS: number = 3.0,
    fps: number = 30,
    amplitude: number = 0.15
  ): MotionSequence {
    const json = this.wasm.generate_ai_motion(durationS, fps, amplitude);
    return JSON.parse(json) as MotionSequence;
  }
}
