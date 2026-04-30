// OpenCV.js を WebWorker で動かして前処理 (二値化・モルフォロジー・SSAA) を実行する。
// メインスレッドからは { type: 'preprocess', seq, width, height, buffer, params } を postMessage で送る。
// 結果は { type: 'result', seq, width, height, buffer } で返す。
//
// このファイルは plain JS (no TS compile)。public/ に置いて static 配信される。

/* global cv */

self.importScripts('/opencv.js');

let ready = false;
const queued = [];

cv['onRuntimeInitialized'] = () => {
  ready = true;
  self.postMessage({ type: 'ready' });
  for (const msg of queued) handle(msg);
  queued.length = 0;
};

self.onmessage = (e) => {
  if (ready) handle(e.data);
  else queued.push(e.data);
};

function handle(msg) {
  if (!msg || msg.type !== 'preprocess') return;
  const { seq, width, height, buffer, params } = msg;

  let srcMat = null;
  let gray = null;
  let binary = null;
  let inv = null;
  let big = null;
  let blurred = null;
  let aa = null;
  let kernel = null;
  let rgba = null;
  try {
    const imageData = new ImageData(
      new Uint8ClampedArray(buffer),
      width,
      height,
    );
    srcMat = cv.matFromImageData(imageData);
    gray = new cv.Mat();
    binary = new cv.Mat();
    inv = new cv.Mat();
    big = new cv.Mat();
    blurred = new cv.Mat();
    aa = new cv.Mat();
    kernel = cv.getStructuringElement(
      cv.MORPH_ELLIPSE,
      new cv.Size(params.morphKsize, params.morphKsize),
    );

    // 1. RGBA → GRAY (白背景合成は呼び出し側の責務)
    cv.cvtColor(srcMat, gray, cv.COLOR_RGBA2GRAY);

    // 2. 二値化
    if (params.useOtsu) {
      cv.threshold(gray, binary, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
    } else {
      cv.threshold(gray, binary, params.fixedThreshold, 255, cv.THRESH_BINARY);
    }

    // 3. モルフォロジー (前景=白前提のため反転して処理して戻す)
    if (params.morphCloseIter > 0 || params.morphOpenIter > 0) {
      cv.bitwise_not(binary, inv);
      if (params.morphCloseIter > 0) {
        cv.morphologyEx(
          inv,
          inv,
          cv.MORPH_CLOSE,
          kernel,
          new cv.Point(-1, -1),
          params.morphCloseIter,
          cv.BORDER_CONSTANT,
          cv.morphologyDefaultBorderValue(),
        );
      }
      if (params.morphOpenIter > 0) {
        cv.morphologyEx(
          inv,
          inv,
          cv.MORPH_OPEN,
          kernel,
          new cv.Point(-1, -1),
          params.morphOpenIter,
          cv.BORDER_CONSTANT,
          cv.morphologyDefaultBorderValue(),
        );
      }
      cv.bitwise_not(inv, binary);
    }

    // 4. メディアン
    if (params.medianKsize > 0) {
      const mk = params.medianKsize | 1;
      cv.medianBlur(binary, binary, mk);
    }

    // 5. スーパーサンプリング AA
    let result;
    if (params.upscale > 1) {
      const w = binary.cols;
      const h = binary.rows;
      cv.resize(
        binary,
        big,
        new cv.Size(w * params.upscale, h * params.upscale),
        0,
        0,
        cv.INTER_NEAREST,
      );
      const sigma =
        params.blurSigma > 0 ? params.blurSigma * params.upscale : 0;
      if (sigma > 0) {
        cv.GaussianBlur(
          big,
          blurred,
          new cv.Size(0, 0),
          sigma,
          sigma,
          cv.BORDER_DEFAULT,
        );
        cv.resize(blurred, aa, new cv.Size(w, h), 0, 0, cv.INTER_AREA);
      } else {
        cv.resize(big, aa, new cv.Size(w, h), 0, 0, cv.INTER_AREA);
      }
      result = aa;
    } else {
      result = binary;
    }

    // 6. GRAY → RGBA に戻して ImageData の buffer として転送
    rgba = new cv.Mat();
    cv.cvtColor(result, rgba, cv.COLOR_GRAY2RGBA);
    // rgba.data は WASM ヒープへの view。Mat.delete() 後に無効化されるので必ずコピーする。
    const out = new Uint8ClampedArray(rgba.data);
    const outBuf = out.buffer;
    self.postMessage(
      {
        type: 'result',
        seq,
        width: rgba.cols,
        height: rgba.rows,
        buffer: outBuf,
      },
      [outBuf],
    );
  } catch (err) {
    self.postMessage({
      type: 'error',
      seq,
      message: (err && err.message) || String(err),
    });
  } finally {
    if (srcMat) srcMat.delete();
    if (gray) gray.delete();
    if (binary) binary.delete();
    if (inv) inv.delete();
    if (kernel) kernel.delete();
    if (big) big.delete();
    if (blurred) blurred.delete();
    if (aa) aa.delete();
    if (rgba) rgba.delete();
  }
}
