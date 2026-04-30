import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ImageDropzone } from "@/components/ImageDropzone";
import { PresetSelector } from "@/components/PresetSelector";
import { PreprocessControls } from "@/components/PreprocessControls";
import { VTracerControls } from "@/components/VTracerControls";
import { PreviewGrid } from "@/components/PreviewGrid";
import { DownloadButton } from "@/components/DownloadButton";
import { useOpenCV } from "@/hooks/useOpenCV";
import { useVTracer } from "@/hooks/useVTracer";
import { usePipeline } from "@/hooks/usePipeline";
import { DEFAULT_PARAMS } from "@/lib/presets";
import type { AllParams } from "@/lib/types";

const LARGE_IMAGE_THRESHOLD = 4096;

function StatusDot({ status }: { status: "loading" | "ready" | "error" }) {
  const color =
    status === "ready"
      ? "bg-green-500"
      : status === "error"
        ? "bg-red-500"
        : "bg-yellow-500";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} aria-hidden />;
}

function App() {
  const opencv = useOpenCV();
  const vtracer = useVTracer();
  const wasmReady = opencv.status === "ready" && vtracer.status === "ready";

  const [params, setParams] = useState<AllParams>(DEFAULT_PARAMS);
  const [source, setSource] = useState<ImageData | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("trace.svg");

  const pipeline = usePipeline(source, params, wasmReady);

  const largeImageWarning = useMemo(() => {
    if (!source) return null;
    if (Math.max(source.width, source.height) > LARGE_IMAGE_THRESHOLD) {
      return `画像サイズが大きい（${source.width}×${source.height}）ため処理に時間がかかります`;
    }
    return null;
  }, [source]);

  const downloadName = fileName.replace(/\.(png|jpg|jpeg)$/i, "") + ".svg";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <h1 className="text-2xl font-semibold">線画ベクター化プレイグラウンド</h1>
          <p className="text-sm text-muted-foreground">
            OpenCV.js + vectortracer によるブラウザ完結のベクター化ツール
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-4 p-6 lg:grid-cols-[400px_1fr]">
        {/* 左ペイン: 入力 + パラメータ */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">ライブラリ状態</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <StatusDot status={opencv.status} />
                <span>OpenCV.js</span>
                <span className="text-muted-foreground">{opencv.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusDot status={vtracer.status} />
                <span>vectortracer</span>
                <span className="text-muted-foreground">{vtracer.status}</span>
              </div>
              {(opencv.error || vtracer.error) && (
                <div className="text-destructive">
                  <p>ロードに失敗しました。リロードしてください。</p>
                  {opencv.error && (
                    <p className="mt-1 break-all font-mono text-xs">
                      OpenCV: {opencv.error}
                    </p>
                  )}
                  {vtracer.error && (
                    <p className="mt-1 break-all font-mono text-xs">
                      vtracer: {vtracer.error}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">入力画像</CardTitle>
            </CardHeader>
            <CardContent>
              <ImageDropzone
                onChange={({ imageData, previewUrl, fileName }) => {
                  setSource(imageData);
                  setPreviewUrl(previewUrl);
                  setFileName(fileName);
                }}
              />
              {largeImageWarning && (
                <p className="mt-2 text-xs text-amber-600">{largeImageWarning}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">パラメータ</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <PresetSelector current={params} onApply={setParams} />
              <Separator />
              <div>
                <h4 className="mb-3 text-sm font-semibold">前処理</h4>
                <PreprocessControls
                  params={params.preprocess}
                  onChange={(p) => setParams({ ...params, preprocess: p })}
                />
              </div>
              <Separator />
              <div>
                <h4 className="mb-3 text-sm font-semibold">VTracer</h4>
                <VTracerControls
                  params={params.vtracer}
                  onChange={(p) => setParams({ ...params, vtracer: p })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右ペイン: プレビュー */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span>プレビュー</span>
                <DownloadButton
                  svg={pipeline.result?.svg ?? ""}
                  fileName={downloadName}
                  disabled={pipeline.status !== "success"}
                />
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm">
                {!wasmReady && (
                  <span className="text-muted-foreground">ライブラリ読み込み中…</span>
                )}
                {wasmReady && !source && (
                  <span className="text-muted-foreground">
                    画像をアップロードしてください
                  </span>
                )}
                {pipeline.status === "running" && (
                  <span className="text-muted-foreground">処理中…</span>
                )}
                {pipeline.status === "error" && (
                  <span className="text-destructive">エラー: {pipeline.error}</span>
                )}
                {pipeline.status === "success" && pipeline.result && (
                  <>
                    <span>
                      パス数:{" "}
                      <span className="font-mono">{pipeline.result.stats.pathCount}</span>
                    </span>
                    <span>
                      SVG:{" "}
                      <span className="font-mono">
                        {(pipeline.result.stats.svgBytes / 1024).toFixed(1)} KB
                      </span>
                    </span>
                    <span>
                      所要:{" "}
                      <span className="font-mono">
                        {pipeline.result.timings.total.toFixed(0)} ms
                      </span>{" "}
                      <span className="text-muted-foreground">
                        (前処理 {pipeline.result.timings.preprocess.toFixed(0)} +
                        ベクター化 {pipeline.result.timings.vectorize.toFixed(0)})
                      </span>
                    </span>
                  </>
                )}
                {pipeline.status === "success" &&
                  pipeline.result &&
                  pipeline.result.stats.pathCount === 0 && (
                    <span className="text-amber-600">
                      ベクター化できませんでした（線が検出されません）
                    </span>
                  )}
              </div>
              <PreviewGrid
                originalUrl={previewUrl}
                preprocessed={pipeline.result?.preprocessed ?? null}
                svg={pipeline.result?.svg ?? ""}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default App;
