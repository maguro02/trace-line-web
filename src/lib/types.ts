export interface PreprocessParams {
  useOtsu: boolean;
  fixedThreshold: number; // 0-255
  morphKsize: number; // 1-9 odd
  morphCloseIter: number; // 0-5
  morphOpenIter: number; // 0-5
  medianKsize: number; // 0-9 (0 で無効)
  upscale: number; // 1-8
  blurSigma: number; // 0.0-4.0
}

export type VTracerMode = "spline" | "polygon" | "none";

export interface VTracerParams {
  mode: VTracerMode;
  filterSpeckle: number; // 0-32
  cornerThreshold: number; // 0-180
  lengthThreshold: number; // 0.0-10.0
  spliceThreshold: number; // 0-180
  pathPrecision: number; // 0-8
}

export interface AllParams {
  preprocess: PreprocessParams;
  vtracer: VTracerParams;
}

export interface PresetDef {
  id: string;
  label: string;
  preprocess: Partial<PreprocessParams>;
  vtracer: Partial<VTracerParams>;
}

export interface PipelineResult {
  /** 前処理後グレースケール画像（プレビュー表示用 ImageData） */
  preprocessed: ImageData;
  /** VTracer 出力 SVG 文字列（DOM 挿入時は sanitize 必須） */
  svg: string;
  /** 統計情報（path 数 / バイト数） */
  stats: { pathCount: number; svgBytes: number };
  /** 各ステップの所要時間 [ms] */
  timings: { preprocess: number; vectorize: number; total: number };
}
