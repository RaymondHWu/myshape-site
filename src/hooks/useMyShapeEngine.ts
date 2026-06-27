/**
 * useMyShapeEngine — React hook for lazy-loading the WASM engine.
 *
 * Dynamically imports the 572KB WASM binary on first use.
 * Singleton pattern — one engine instance per browser session.
 *
 * Usage:
 *   const { engine, loading, error, load } = useMyShapeEngine();
 *   // engine is null until load() is called and WASM initializes
 *   await load();
 *   const humanMotion = engine!.generateHumanMotion(1.0, 30, 0.15);
 */

import { useRef, useState, useCallback } from 'react';
import type { MyShapeEngine } from '@/types/myshape-engine';

interface EngineState {
  engine: MyShapeEngine | null;
  loading: boolean;
  error: string | null;
}

// Module-level singleton — WASM is expensive to re-initialize
let globalEngine: MyShapeEngine | null = null;
let globalInitPromise: Promise<MyShapeEngine> | null = null;

export function useMyShapeEngine() {
  const [state, setState] = useState<EngineState>({
    engine: globalEngine,
    loading: false,
    error: null,
  });
  const initRef = useRef(globalInitPromise);

  const load = useCallback(async () => {
    // Already loaded
    if (globalEngine) {
      setState({ engine: globalEngine, loading: false, error: null });
      return globalEngine;
    }

    // Already loading — wait for existing promise
    if (globalInitPromise) {
      setState({ engine: null, loading: true, error: null });
      try {
        await globalInitPromise;
        setState({ engine: globalEngine, loading: false, error: null });
        return globalEngine;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'WASM init failed';
        setState({ engine: null, loading: false, error: msg });
        return null;
      }
    }

    // Start loading
    setState({ engine: null, loading: true, error: null });

    globalInitPromise = (async () => {
      const { MyShapeBrowserSDK } = await import('../../wasm/myshape-sdk.browser');
      const sdk = await MyShapeBrowserSDK.init();
      globalEngine = sdk as unknown as MyShapeEngine;
      globalInitPromise = null;
      return sdk as unknown as MyShapeEngine;
    })();

    try {
      const sdk = await globalInitPromise;
      setState({ engine: sdk, loading: false, error: null });
      return sdk;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'WASM init failed';
      globalInitPromise = null;
      setState({ engine: null, loading: false, error: msg });
      return null;
    }
  }, []);

  return { ...state, load };
}
