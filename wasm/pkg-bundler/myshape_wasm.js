/* @ts-self-types="./myshape_wasm.d.ts" */
import * as wasm from "./myshape_wasm_bg.wasm";
import { __wbg_set_wasm } from "./myshape_wasm_bg.js";

__wbg_set_wasm(wasm);
wasm.__wbindgen_start();
export {
    create_enrollment, extract_signature, generate_ai_motion, generate_challenge, generate_human_motion, init_panic_hook, similarity, verify_intent
} from "./myshape_wasm_bg.js";
