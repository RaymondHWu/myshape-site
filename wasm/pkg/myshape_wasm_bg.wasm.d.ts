/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const create_enrollment: (a: number, b: number, c: number, d: number, e: number, f: number) => [number, number, number, number];
export const extract_feature_vector: (a: number, b: number) => [number, number, number, number];
export const extract_signature: (a: number, b: number) => [number, number, number, number];
export const generate_ai_motion: (a: number, b: number, c: number) => [number, number];
export const generate_challenge: (a: number, b: number) => [number, number, number, number];
export const generate_human_motion: (a: number, b: number, c: number) => [number, number];
export const get_calibration_info: () => [number, number];
export const get_feature_dim: () => number;
export const init_panic_hook: () => void;
export const is_calibrated: () => number;
export const load_calibration: (a: number, b: number) => [number, number, number];
export const reset_calibration: () => void;
export const similarity: (a: number, b: number, c: number, d: number) => number;
export const verify_intent: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number) => [number, number, number, number];
export const __wbindgen_exn_store: (a: number) => void;
export const __externref_table_alloc: () => number;
export const __wbindgen_externrefs: WebAssembly.Table;
export const __wbindgen_free: (a: number, b: number, c: number) => void;
export const __wbindgen_malloc: (a: number, b: number) => number;
export const __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
export const __externref_table_dealloc: (a: number) => void;
export const __wbindgen_start: () => void;
