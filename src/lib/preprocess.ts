import type { PreprocessParams } from "./types";
import { preprocessInWorker } from "./opencv-loader";

/**
 * 入力 ImageData → 前処理済みグレースケール ImageData
 * Python 版 playground.py:preprocess() と等価。
 *
 * 透明背景の合成は ImageDropzone 側の Canvas 描画で実施済み前提。
 * 実体は WebWorker (opencv-preprocess.worker.js) で実行される。
 */
export function preprocessImage(
  src: ImageData,
  params: PreprocessParams,
): Promise<ImageData> {
  return preprocessInWorker(src, params);
}
