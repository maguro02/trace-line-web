import type { AllParams, PresetDef } from "./types";

export const DEFAULT_PARAMS: AllParams = {
  preprocess: {
    useOtsu: true,
    fixedThreshold: 180,
    morphKsize: 3,
    morphCloseIter: 2,
    morphOpenIter: 1,
    medianKsize: 5,
    upscale: 4,
    blurSigma: 1.5,
  },
  vtracer: {
    mode: "spline",
    filterSpeckle: 4,
    cornerThreshold: 80,
    lengthThreshold: 5.0,
    spliceThreshold: 60,
    pathPrecision: 3,
  },
};

export const PRESETS: PresetDef[] = [
  {
    id: "v1-balanced",
    name: "バランス",
    tag: "v1",
    description: "汎用的な線画向け既定値",
    preprocess: {
      morphCloseIter: 2,
      morphOpenIter: 1,
      medianKsize: 5,
      upscale: 4,
      blurSigma: 1.5,
    },
    vtracer: {
      cornerThreshold: 80,
      lengthThreshold: 5.0,
      spliceThreshold: 60,
      filterSpeckle: 4,
    },
  },
  {
    id: "v2-corner",
    name: "角優先",
    tag: "v2",
    description: "ペン入れ・推奨設定",
    preprocess: {
      morphCloseIter: 1,
      morphOpenIter: 0,
      medianKsize: 5,
      upscale: 4,
      blurSigma: 1.0,
    },
    vtracer: {
      cornerThreshold: 50,
      lengthThreshold: 3.0,
      spliceThreshold: 40,
      filterSpeckle: 4,
    },
  },
  {
    id: "v3-corner-max",
    name: "角最大保持",
    tag: "v3",
    description: "細部を最も忠実に",
    preprocess: {
      morphCloseIter: 1,
      morphOpenIter: 0,
      medianKsize: 3,
      upscale: 4,
      blurSigma: 0.8,
    },
    vtracer: {
      cornerThreshold: 30,
      lengthThreshold: 2.0,
      spliceThreshold: 30,
      filterSpeckle: 2,
    },
  },
  {
    id: "smooth",
    name: "滑らか優先",
    tag: "+",
    description: "曲線重視・パス数低め",
    preprocess: {
      morphCloseIter: 3,
      morphOpenIter: 2,
      medianKsize: 7,
      upscale: 4,
      blurSigma: 2.0,
    },
    vtracer: {
      cornerThreshold: 100,
      lengthThreshold: 8.0,
      spliceThreshold: 80,
      filterSpeckle: 8,
    },
  },
];
