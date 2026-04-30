import { useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { ImageDropzone } from "@/components/ImageDropzone";
import { PresetSelector } from "@/components/PresetSelector";
import { PreprocessControls } from "@/components/PreprocessControls";
import { VTracerControls } from "@/components/VTracerControls";
import { PreviewGrid } from "@/components/PreviewGrid";
import { DownloadButton } from "@/components/DownloadButton";
import { useOpenCV } from "@/hooks/useOpenCV";
import { useVTracer } from "@/hooks/useVTracer";
import { usePipeline } from "@/hooks/usePipeline";
import { DEFAULT_PARAMS, PRESETS } from "@/lib/presets";
import type { AllParams } from "@/lib/types";
import { cn } from "@/lib/utils";

const LARGE_IMAGE_THRESHOLD = 4096;

interface SourceMeta {
  imageData: ImageData;
  previewUrl: string;
  fileName: string;
  fileSize: number;
}

function StatusPill({
  opencv,
  vtracer,
}: {
  opencv: { status: "loading" | "ready" | "error"; error: string | null };
  vtracer: { status: "loading" | "ready" | "error"; error: string | null };
}) {
  const ready = opencv.status === "ready" && vtracer.status === "ready";
  const error = opencv.status === "error" || vtracer.status === "error";
  const label = error ? "WASM Error" : ready ? "WASM Ready" : "WASM Loading";
  const dotClass = error
    ? "bg-destructive"
    : ready
      ? "bg-emerald-400 shadow-[0_0_10px_hsl(160_70%_45%/0.7)] animate-pulse-soft"
      : "bg-amber-400 animate-pulse-soft";
  return (
    <div className="flex items-center gap-2 rounded-full border border-rule bg-ink-1/60 px-2.5 py-1 font-mono text-[10px] tracking-[0.06em] text-muted-foreground">
      <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
      <span>{label}</span>
    </div>
  );
}

function SectionLabel({ num, children }: { num: string; children: React.ReactNode }) {
  return (
    <div className="mb-2.5 flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
      <span>
        <span className="text-accent">{num}</span> {children}
      </span>
      <span className="h-px flex-1 bg-rule" aria-hidden />
    </div>
  );
}

function Accordion({
  title,
  count,
  children,
  defaultOpen = false,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-md border border-rule bg-ink-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-[12px] font-medium tracking-tight"
      >
        <span>
          {title}{" "}
          <span className="ml-1 font-mono text-[10px] text-muted-foreground">
            {count}
          </span>
        </span>
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
            open && "rotate-90 text-accent",
          )}
        />
      </button>
      {open && (
        <div className="border-t border-rule bg-background px-3.5 py-3.5">
          {children}
        </div>
      )}
    </div>
  );
}

function App() {
  const opencv = useOpenCV();
  const vtracer = useVTracer();
  const wasmReady = opencv.status === "ready" && vtracer.status === "ready";

  const [params, setParams] = useState<AllParams>(DEFAULT_PARAMS);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [source, setSource] = useState<SourceMeta | null>(null);

  const pipeline = usePipeline(source?.imageData ?? null, params, wasmReady);

  const largeImageWarning = useMemo(() => {
    if (!source) return null;
    const { width, height } = source.imageData;
    if (Math.max(width, height) > LARGE_IMAGE_THRESHOLD) {
      return `画像サイズが大きい（${width}×${height}）ため処理に時間がかかります`;
    }
    return null;
  }, [source]);

  const downloadName = (source?.fileName ?? "trace.svg")
    .replace(/\.(png|jpg|jpeg)$/i, "")
    + ".svg";

  // Keyboard shortcuts: 1-4 to apply presets, ⌘S / Ctrl+S to download.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

      if ((e.metaKey || e.ctrlKey) && (e.key === "s" || e.key === "S")) {
        if (pipeline.status === "success" && pipeline.result?.svg) {
          e.preventDefault();
          const blob = new Blob([pipeline.result.svg], { type: "image/svg+xml" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = downloadName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        return;
      }

      const num = Number(e.key);
      if (num >= 1 && num <= PRESETS.length) {
        const preset = PRESETS[num - 1];
        setActivePresetId(preset.id);
        setParams((prev) => ({
          preprocess: { ...prev.preprocess, ...preset.preprocess },
          vtracer: { ...prev.vtracer, ...preset.vtracer },
        }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pipeline.status, pipeline.result, downloadName]);

  const currentSourceForDropzone = source
    ? {
        previewUrl: source.previewUrl,
        fileName: source.fileName,
        fileSize: source.fileSize,
        width: source.imageData.width,
        height: source.imageData.height,
      }
    : null;

  return (
    <div className="grid h-screen grid-rows-[56px_1fr_36px] overflow-hidden">
      {/* ───── Topbar ───── */}
      <header className="grid grid-cols-[360px_1fr_auto] items-center border-b border-rule bg-gradient-to-b from-ink-1 to-transparent px-6">
        <div className="flex items-center gap-3.5">
          <BrandMark />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-[16px] text-vellum">
              線画ベクター化プレイグラウンド
            </span>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
              trace · line · web
            </span>
          </div>
        </div>

        <Crumbs
          steps={[
            { label: "入力", active: !!source },
            { label: "調整", active: pipeline.status !== "idle" },
            {
              label: "書き出し",
              active: pipeline.status === "success" && !!pipeline.result?.svg,
            },
          ]}
        />

        <div className="flex items-center gap-3">
          <StatusPill opencv={opencv} vtracer={vtracer} />
          <DownloadButton
            svg={pipeline.result?.svg ?? ""}
            fileName={downloadName}
            disabled={pipeline.status !== "success"}
          />
        </div>
      </header>

      {/* ───── Stage ───── */}
      <div className="grid min-h-0 grid-cols-[360px_1fr]">
        {/* Left rail */}
        <aside className="flex flex-col gap-5 overflow-y-auto border-r border-rule bg-gradient-to-b from-ink-1 via-background to-background px-4 py-5">
          <section>
            <SectionLabel num="01">入力画像</SectionLabel>
            <ImageDropzone
              current={currentSourceForDropzone}
              onChange={({ imageData, previewUrl, fileName, fileSize }) => {
                if (source?.previewUrl) URL.revokeObjectURL(source.previewUrl);
                setSource({ imageData, previewUrl, fileName, fileSize });
              }}
            />
            {largeImageWarning && (
              <p className="mt-2 text-[11px] text-amber-400">{largeImageWarning}</p>
            )}
            {(opencv.error || vtracer.error) && (
              <div className="mt-3 rounded border border-destructive/40 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
                <p className="font-medium">ライブラリ読み込みに失敗しました</p>
                {opencv.error && (
                  <p className="mt-1 break-all font-mono text-[10px] opacity-80">
                    OpenCV: {opencv.error}
                  </p>
                )}
                {vtracer.error && (
                  <p className="mt-1 break-all font-mono text-[10px] opacity-80">
                    vtracer: {vtracer.error}
                  </p>
                )}
              </div>
            )}
          </section>

          <section>
            <SectionLabel num="02">プリセット</SectionLabel>
            <PresetSelector
              current={params}
              activeId={activePresetId}
              onApply={(id, next) => {
                setActivePresetId(id);
                setParams(next);
              }}
            />
          </section>

          <section className="flex flex-col gap-2.5">
            <SectionLabel num="03">詳細パラメータ</SectionLabel>
            <Accordion title="前処理" count={8} defaultOpen={false}>
              <PreprocessControls
                params={params.preprocess}
                onChange={(p) => {
                  setActivePresetId(null);
                  setParams({ ...params, preprocess: p });
                }}
              />
            </Accordion>
            <Accordion title="VTracer" count={6} defaultOpen={false}>
              <VTracerControls
                params={params.vtracer}
                onChange={(p) => {
                  setActivePresetId(null);
                  setParams({ ...params, vtracer: p });
                }}
              />
            </Accordion>
          </section>
        </aside>

        {/* Viewport */}
        <main className="flex min-h-0 flex-col bg-background">
          <PreviewGrid
            preprocessed={pipeline.result?.preprocessed ?? null}
            svg={pipeline.result?.svg ?? ""}
            status={pipeline.status}
            hasSource={!!source}
            ready={wasmReady}
          />
        </main>
      </div>

      {/* ───── HUD ───── */}
      <Hud pipeline={pipeline} activePresetId={activePresetId} />
    </div>
  );
}

function BrandMark() {
  return (
    <div className="relative h-7 w-7 overflow-hidden rounded border border-rule-strong bg-ink-2">
      <span
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, hsl(var(--accent)/0.45), transparent 55%)",
        }}
        aria-hidden
      />
      <span className="absolute inset-1.5 rounded-sm border border-dashed border-accent/70" aria-hidden />
    </div>
  );
}

function Crumbs({ steps }: { steps: { label: string; active: boolean }[] }) {
  return (
    <nav className="flex items-center justify-center gap-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-3.5">
          <span className={cn("inline-flex items-center gap-2", s.active && "text-vellum")}>
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                s.active
                  ? "bg-accent shadow-[0_0_10px_hsl(var(--accent))]"
                  : "bg-rule-strong",
              )}
              aria-hidden
            />
            {s.label}
          </span>
          {i < steps.length - 1 && <span className="h-px w-4 bg-rule-strong" aria-hidden />}
        </div>
      ))}
    </nav>
  );
}

function Hud({
  pipeline,
  activePresetId,
}: {
  pipeline: ReturnType<typeof usePipeline>;
  activePresetId: string | null;
}) {
  const preset = PRESETS.find((p) => p.id === activePresetId);
  const r = pipeline.result;
  return (
    <footer className="grid grid-cols-[360px_1fr_auto] items-center border-t border-rule bg-ink-1 font-mono text-[10px] uppercase tracking-[0.1em]">
      <div className="flex h-full items-center gap-3 px-4 text-muted-foreground">
        <span className="text-[10px] tracking-[0.18em] text-muted-foreground/70">
          プリセット
        </span>
        <span className="text-vellum">
          {preset ? `${preset.tag} · ${preset.name}` : "カスタム"}
        </span>
      </div>

      <div className="flex h-full items-center">
        {pipeline.status === "running" && (
          <span className="flex h-full items-center border-l border-rule px-4 text-accent-soft animate-pulse-soft">
            ◇ 処理中
          </span>
        )}
        {pipeline.status === "error" && (
          <span className="flex h-full items-center border-l border-rule px-4 text-destructive">
            ✕ エラー: {pipeline.error}
          </span>
        )}
        {pipeline.status === "success" && r && (
          <>
            <Readout label="paths" value={r.stats.pathCount.toLocaleString()} />
            <Readout
              label="size"
              value={(r.stats.svgBytes / 1024).toFixed(1)}
              unit="KB"
            />
            <Readout label="pre" value={r.timings.preprocess.toFixed(0)} unit="ms" />
            <Readout label="vec" value={r.timings.vectorize.toFixed(0)} unit="ms" />
            <Readout
              label="total"
              value={r.timings.total.toFixed(0)}
              unit="ms"
              highlight
            />
            {r.stats.pathCount === 0 && (
              <span className="flex h-full items-center border-l border-rule px-4 text-amber-400">
                ⚠ 線が検出されません
              </span>
            )}
          </>
        )}
        {pipeline.status === "idle" && (
          <span className="flex h-full items-center border-l border-rule px-4 text-muted-foreground/60">
            待機中
          </span>
        )}
      </div>

      <div className="flex h-full items-center gap-3.5 pr-4 text-muted-foreground">
        <span className="hidden md:inline">
          <Kbd>1</Kbd>
          <Kbd>2</Kbd>
          <Kbd>3</Kbd>
          <Kbd>4</Kbd> プリセット
        </span>
        <span>
          <Kbd>⌘S</Kbd> 保存
        </span>
      </div>
    </footer>
  );
}

function Readout({
  label,
  value,
  unit,
  highlight,
}: {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex h-full items-center gap-2 border-l border-rule px-4">
      <span className="text-muted-foreground/60">{label}</span>
      <span className={cn("font-medium", highlight ? "text-accent-soft" : "text-vellum")}>
        {value}
      </span>
      {unit && <span className="text-[9px] text-muted-foreground/60">{unit}</span>}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="mr-1 inline-block rounded border border-rule bg-ink-2 px-1 py-px font-mono text-[9px] text-vellum-dim">
      {children}
    </kbd>
  );
}

export default App;
