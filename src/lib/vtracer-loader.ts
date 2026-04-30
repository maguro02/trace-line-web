import type {
  BinaryImageConverter,
  BinaryImageConverterParams,
  Options as VTracerSvgOptions,
} from "vectortracer";

export type { BinaryImageConverterParams, VTracerSvgOptions };

interface VTracerModule {
  BinaryImageConverter: typeof BinaryImageConverter;
}

let vtracerInstance: VTracerModule | null = null;
let loadPromise: Promise<VTracerModule> | null = null;

/**
 * vectortracer (WASM) を非同期にロードする。
 * vite-plugin-wasm が wasm-bindgen の初期化を行うため、ここでは ESM の動的 import のみ。
 */
export function loadVTracer(): Promise<VTracerModule> {
  if (vtracerInstance) return Promise.resolve(vtracerInstance);
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const mod = await import("vectortracer");
    vtracerInstance = { BinaryImageConverter: mod.BinaryImageConverter };
    return vtracerInstance;
  })();

  return loadPromise;
}
