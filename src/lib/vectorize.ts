import type { VTracerParams } from "./types";
import { loadVTracer } from "./vtracer-loader";

const DEG2RAD = Math.PI / 180;

/**
 * 前処理済み ImageData → SVG 文字列
 * vectortracer の BinaryImageConverter は tick ベースの API を持つ。
 * 重い処理を細かく分割実行できるが、PoC では同期的にループで完了まで回す。
 *
 * 注意: vectortracer (visioncortex) は cornerThreshold / spliceThreshold を
 * ラジアンで受け取る。UI / Python 版は度数で扱っているため呼び出し側で変換する。
 * (ref: node_modules/vectortracer/src/lib.rs:51-54 の default 値)
 */
export async function vectorize(
  preprocessed: ImageData,
  params: VTracerParams,
): Promise<{ svg: string; pathCount: number; svgBytes: number }> {
  const { BinaryImageConverter } = await loadVTracer();

  const converter = new BinaryImageConverter(
    preprocessed,
    {
      debug: false,
      mode: params.mode,
      cornerThreshold: params.cornerThreshold * DEG2RAD,
      lengthThreshold: params.lengthThreshold,
      spliceThreshold: params.spliceThreshold * DEG2RAD,
      filterSpeckle: params.filterSpeckle,
      pathPrecision: params.pathPrecision,
    },
    {
      invert: false,
      pathFill: undefined,
      backgroundColor: undefined,
      attributes: undefined,
    },
  );

  try {
    converter.init();
    // tick が true を返すまで（= 完了まで）回す
    let safetyCounter = 0;
    while (!converter.tick()) {
      safetyCounter += 1;
      if (safetyCounter > 100000) {
        throw new Error("vectorize: tick loop did not terminate");
      }
    }
    const rawSvg = converter.getResult();
    // vectortracer の SVG は viewBox / width / height を出力しないので、プレビュー時に
    // 内部座標系が決まらず崩れる。元画像サイズで viewBox を注入してアスペクト比を確定させる。
    const svg = injectViewBox(rawSvg, preprocessed.width, preprocessed.height);
    // vectortracer の <path> は複数行 ("<path\n    d=...") で出力されるため、
    // 半角スペースではなくワード境界でカウントする。
    const pathCount = (svg.match(/<path\b/g) ?? []).length;
    const svgBytes = new TextEncoder().encode(svg).length;
    return { svg, pathCount, svgBytes };
  } finally {
    converter.free();
  }
}

function injectViewBox(svg: string, width: number, height: number): string {
  // 既に viewBox があれば触らない
  if (/<svg[^>]*\bviewBox\s*=/.test(svg)) return svg;
  return svg.replace(
    /<svg\b/,
    `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"`,
  );
}
