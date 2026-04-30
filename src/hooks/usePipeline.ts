import { useEffect, useState } from "react";
import { preprocessImage } from "@/lib/preprocess";
import { vectorize } from "@/lib/vectorize";
import type { AllParams, PipelineResult } from "@/lib/types";
import { useDebouncedValue } from "./useDebouncedValue";

export interface PipelineState {
  status: "idle" | "running" | "success" | "error";
  result: PipelineResult | null;
  error: string | null;
}

/**
 * 入力画像 + パラメータ → 前処理 + ベクター化 を実行する。
 * パラメータ変更は debounceMs 遅延後に反映され、連打中の途中結果はキャンセルされる。
 */
export function usePipeline(
  source: ImageData | null,
  params: AllParams,
  ready: boolean,
  debounceMs = 300,
): PipelineState {
  const debouncedParams = useDebouncedValue(params, debounceMs);
  const [state, setState] = useState<PipelineState>({
    status: "idle",
    result: null,
    error: null,
  });

  useEffect(() => {
    if (!source || !ready) {
      setState({ status: "idle", result: null, error: null });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, status: "running" }));
    (async () => {
      try {
        const t0 = performance.now();
        const preprocessed = await preprocessImage(source, debouncedParams.preprocess);
        const t1 = performance.now();
        const vec = await vectorize(preprocessed, debouncedParams.vtracer);
        const t2 = performance.now();
        if (cancelled) return;
        setState({
          status: "success",
          result: {
            preprocessed,
            svg: vec.svg,
            stats: { pathCount: vec.pathCount, svgBytes: vec.svgBytes },
            timings: {
              preprocess: t1 - t0,
              vectorize: t2 - t1,
              total: t2 - t0,
            },
          },
          error: null,
        });
      } catch (e: unknown) {
        if (cancelled) return;
        setState({ status: "error", result: null, error: String(e) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source, debouncedParams, ready]);

  return state;
}
