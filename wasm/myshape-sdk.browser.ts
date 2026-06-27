/**
 * MyShape Protocol — Browser SDK v0.1
 *
 * Browser-compatible wrapper around the WASM core engine.
 * Uses Web Crypto API. Importable directly in Next.js components.
 *
 * Usage:
 *   import { MyShapeBrowserSDK } from '@/wasm/myshape-sdk.browser';
 *   const sdk = await MyShapeBrowserSDK.init();
 *   const challenge = await sdk.generateChallenge();
 */

import type {
  Challenge, MotionSequence, MotionSignature, Enrollment,
  DeviceInfo, VerificationResult, VerifyIntentContext,
} from './myshape-sdk';

// Re-export types from the base SDK
export type {
  Challenge, ChallengeAction, MotionSequence, MotionSignature,
  Enrollment, DeviceInfo, LocationInfo, VerificationResult,
  VerifyIntentContext, PoseFrame, Keypoint, ImuSequence,
  FactorScores, TimingConstraints, ChallengeResponse,
} from './myshape-sdk';

// ── WASM Module Type (bundler target) ──

interface MyShapeWasmBundler {
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

// ── Browser SDK ──

export class MyShapeBrowserSDK {
  private wasm: MyShapeWasmBundler;
  private sessionKey: Uint8Array;

  private constructor(wasm: MyShapeWasmBundler, sessionKey: Uint8Array) {
    this.wasm = wasm;
    this.sessionKey = sessionKey;
  }

  /**
   * Initialize the SDK by dynamically importing the WASM module.
   *
   * The WASM binary is loaded via Next.js/webpack's native WASM support.
   * Requires `experiments.asyncWebAssembly: true` in next.config.js.
   */
  static async init(): Promise<MyShapeBrowserSDK> {
    // Generate a random session key via Web Crypto API
    const sessionKey = crypto.getRandomValues(new Uint8Array(32));

    // Dynamic import of the bundler WASM module
    const wasmModule = (await import('./pkg-bundler/myshape_wasm.js')) as MyShapeWasmBundler;

    return new MyShapeBrowserSDK(wasmModule, sessionKey);
  }

  // ── Core API ──

  /**
   * Generate a new presence verification challenge.
   */
  generateChallenge(): Challenge {
    const hex = Array.from(this.sessionKey)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const json = this.wasm.generate_challenge(hex);
    return JSON.parse(json) as Challenge;
  }

  /**
   * Extract a Motion Signature from raw motion data.
   */
  extractSignature(motion: MotionSequence): MotionSignature {
    const json = this.wasm.extract_signature(JSON.stringify(motion));
    return JSON.parse(json) as MotionSignature;
  }

  /**
   * Compute similarity between two signatures (L2-normalized distance).
   */
  similarity(enrollment: MotionSignature, response: MotionSignature): number {
    return this.wasm.similarity(
      JSON.stringify(enrollment),
      JSON.stringify(response)
    );
  }

  /**
   * Create an enrollment from multiple motion samples.
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
   * PRIMARY: One-call verification interface.
   */
  verifyIntent(
    challenge: Challenge,
    motionSequence: MotionSequence,
    context: VerifyIntentContext,
    enrollment: Enrollment
  ): VerificationResult {
    const response = {
      challenge_id: challenge.challenge_id,
      user_id: enrollment.user_id,
      pose_sequence: motionSequence,
      imu_sequence: {
        sample_rate_hz: context.device.imu_sample_rate_hz ?? 200,
        samples: [],
      },
      device_info: context.device,
      location: context.location,
    };

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

  // ── Demo Utilities ──

  /** Generate synthetic human-like motion with realistic micro-tremor. */
  generateHumanMotion(
    durationS: number = 3.0,
    fps: number = 30,
    amplitude: number = 0.15
  ): MotionSequence {
    const json = this.wasm.generate_human_motion(durationS, fps, amplitude);
    return JSON.parse(json) as MotionSequence;
  }

  /** Generate synthetic AI-forged motion (detectably fake). */
  generateAIMotion(
    durationS: number = 3.0,
    fps: number = 30,
    amplitude: number = 0.15
  ): MotionSequence {
    const json = this.wasm.generate_ai_motion(durationS, fps, amplitude);
    return JSON.parse(json) as MotionSequence;
  }
}
