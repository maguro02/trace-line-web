import type { PreprocessParams } from "./types";

// OpenCV.js は WebWorker (public/opencv-preprocess.worker.js) で実行する。
// public/opencv.js を Worker 内で importScripts するため、メインスレッドは
// 巨大な WASM のパース・コンパイルからは完全に切り離される。

const WORKER_URL = "/opencv-preprocess.worker.js";
const INIT_TIMEOUT_MS = 30_000;
const PREPROCESS_TIMEOUT_MS = 30_000;

interface ResultMsg {
  type: "result";
  seq: number;
  width: number;
  height: number;
  buffer: ArrayBuffer;
}
interface ErrorMsg {
  type: "error";
  seq?: number;
  message: string;
}
interface ReadyMsg {
  type: "ready";
}
type WorkerMsg = ResultMsg | ErrorMsg | ReadyMsg;

let workerPromise: Promise<Worker> | null = null;
let seqCounter = 0;

function getWorker(): Promise<Worker> {
  if (workerPromise) return workerPromise;
  workerPromise = new Promise<Worker>((resolve, reject) => {
    const t0 = performance.now();
    let w: Worker;
    try {
      w = new Worker(WORKER_URL);
    } catch (e) {
      reject(e);
      return;
    }

    const timer = setTimeout(() => {
      w.terminate();
      reject(
        new Error(
          `OpenCV Worker の初期化が ${INIT_TIMEOUT_MS}ms でタイムアウトしました (wasm ロード失敗の可能性)`,
        ),
      );
    }, INIT_TIMEOUT_MS);

    const onReady = (e: MessageEvent<WorkerMsg>) => {
      if (e.data?.type === "ready") {
        clearTimeout(timer);
        w.removeEventListener("message", onReady);
        // eslint-disable-next-line no-console
        console.log(
          `[opencv-loader] worker ready in ${Math.round(
            performance.now() - t0,
          )}ms`,
        );
        resolve(w);
      } else if (e.data?.type === "error") {
        clearTimeout(timer);
        reject(new Error(e.data.message));
      }
    };
    w.addEventListener("message", onReady);
    w.addEventListener("error", (ev) => {
      clearTimeout(timer);
      reject(new Error(`Worker load error: ${ev.message || "unknown"}`));
    });
  });
  // 失敗時は次回再試行できるようリセット
  workerPromise.catch(() => {
    workerPromise = null;
  });
  return workerPromise;
}

/**
 * Worker をスポーンし、OpenCV.js の wasm 初期化完了 (`ready`) を待つ。
 * 既存呼び出し側 (useOpenCV) との互換のため Promise<void> を返す。
 */
export function loadOpenCV(): Promise<void> {
  return getWorker().then(() => undefined);
}

/**
 * 前処理を Worker 内で実行する。
 * 入力 ImageData の data はコピーしてから Transferable として渡すので、
 * 呼び出し側の ImageData は無効化されない。
 */
export async function preprocessInWorker(
  src: ImageData,
  params: PreprocessParams,
): Promise<ImageData> {
  const worker = await getWorker();
  const seq = ++seqCounter;
  const copy = new Uint8ClampedArray(src.data);
  const inputBuf = copy.buffer;

  return new Promise<ImageData>((resolve, reject) => {
    const timer = setTimeout(() => {
      worker.removeEventListener("message", onMsg);
      reject(
        new Error(`OpenCV 前処理が ${PREPROCESS_TIMEOUT_MS}ms でタイムアウト`),
      );
    }, PREPROCESS_TIMEOUT_MS);

    const onMsg = (e: MessageEvent<WorkerMsg>) => {
      const data = e.data;
      if (!data || (data.type !== "result" && data.type !== "error")) return;
      if ("seq" in data && data.seq !== seq) return;
      clearTimeout(timer);
      worker.removeEventListener("message", onMsg);
      if (data.type === "result") {
        resolve(
          new ImageData(
            new Uint8ClampedArray(data.buffer),
            data.width,
            data.height,
          ),
        );
      } else {
        reject(new Error(data.message));
      }
    };
    worker.addEventListener("message", onMsg);

    worker.postMessage(
      {
        type: "preprocess",
        seq,
        width: src.width,
        height: src.height,
        buffer: inputBuf,
        params,
      },
      [inputBuf],
    );
  });
}
