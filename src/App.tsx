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
    <div
      title={label}
      className="flex items-center gap-2 rounded-full border border-rule bg-ink-1/60 px-1.5 py-1 font-mono text-[10px] tracking-[0.06em] text-muted-foreground sm:px-2.5"
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
      <span className="hidden sm:inline">{label}</span>
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

  // Section content: rendered once, placed via flex `order` on mobile and inside
  // `<aside>` on desktop. The wrapper uses `display: contents` on mobile so its
  // children flatten into the parent flex column, allowing the viewport to be
  // visually inserted between the preset section and the detail-params section.
  const inputSection = (
    <section className="order-1 border-b border-rule px-4 py-5 lg:order-none lg:border-0 lg:p-0">
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
  );

  const presetSection = (
    <section className="order-2 border-b border-rule px-4 py-5 lg:order-none lg:border-0 lg:p-0">
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
  );

  const detailsSection = (
    <section className="order-4 flex flex-col gap-2.5 border-t border-rule px-4 py-5 lg:order-none lg:border-0 lg:p-0">
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
  );

  return (
    <div className="flex min-h-[100dvh] flex-col lg:grid lg:h-[100dvh] lg:grid-rows-[56px_1fr_36px] lg:overflow-hidden">
      {/* ───── Topbar ───── */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-rule bg-background/85 px-4 backdrop-blur-md lg:static lg:grid lg:h-auto lg:grid-cols-[360px_1fr_auto] lg:bg-gradient-to-b lg:from-ink-1 lg:to-transparent lg:px-6 lg:backdrop-blur-0">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark />
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate font-display text-[14px] text-vellum lg:text-[16px]">
              線画ベクター化プレイグラウンド
            </span>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground lg:inline">
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

        <div className="flex shrink-0 items-center gap-2 lg:gap-3">
          <StatusPill opencv={opencv} vtracer={vtracer} />
          <DownloadButton
            svg={pipeline.result?.svg ?? ""}
            fileName={downloadName}
            disabled={pipeline.status !== "success"}
          />
        </div>
      </header>

      {/* ───── Stage ───── */}
      <div className="flex flex-1 flex-col lg:grid lg:min-h-0 lg:grid-cols-[360px_1fr]">
        {/*
          Rail: on mobile the wrapper uses `display: contents`, so its children
          flatten into the parent flex column. Section order is controlled per
          child via `order-*`. On desktop, the wrapper becomes a scrollable
          left column.
        */}
        <aside className="contents lg:flex lg:flex-col lg:gap-5 lg:overflow-y-auto lg:border-r lg:border-rule lg:bg-gradient-to-b lg:from-ink-1 lg:via-background lg:to-background lg:px-4 lg:py-5">
          {inputSection}
          {presetSection}
          {detailsSection}
        </aside>

        <main className="order-3 flex min-h-[60vh] flex-col bg-background lg:order-none lg:min-h-0">
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
    <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded border border-rule-strong bg-ink-2">
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
    <nav className="hidden items-center justify-center gap-3.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground lg:flex">
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
    <footer className="sticky bottom-0 z-10 grid h-9 grid-cols-[auto_1fr] items-center border-t border-rule bg-ink-1/95 font-mono text-[10px] uppercase tracking-[0.1em] backdrop-blur-md lg:static lg:grid-cols-[360px_1fr_auto] lg:bg-ink-1 lg:backdrop-blur-0">
      <div className="hidden h-full items-center gap-3 px-4 text-muted-foreground lg:flex">
        <span className="text-[10px] tracking-[0.18em] text-muted-foreground/70">
          プリセット
        </span>
        <span className="text-vellum">
          {preset ? `${preset.tag} · ${preset.name}` : "カスタム"}
        </span>
      </div>
      {/* Mobile preset cell: just show tag + name compactly */}
      <div className="flex h-full items-center gap-2 px-3 text-muted-foreground lg:hidden">
        <span className="text-[9px] tracking-[0.16em] text-muted-foreground/70">
          {preset ? preset.tag : "—"}
        </span>
        <span className="truncate text-[10px] text-vellum">
          {preset ? preset.name : "カスタム"}
        </span>
      </div>

      <div className="flex h-full min-w-0 items-center overflow-x-auto">
        {pipeline.status === "running" && (
          <span className="flex h-full shrink-0 items-center border-l border-rule px-3 text-accent-soft animate-pulse-soft lg:px-4">
            ◇ <span className="ml-1 hidden sm:inline">処理中</span>
          </span>
        )}
        {pipeline.status === "error" && (
          <span className="flex h-full shrink-0 items-center border-l border-rule px-3 text-destructive lg:px-4">
            ✕ エラー
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
            <Readout
              label="pre"
              value={r.timings.preprocess.toFixed(0)}
              unit="ms"
              hideOnMobile
            />
            <Readout
              label="vec"
              value={r.timings.vectorize.toFixed(0)}
              unit="ms"
              hideOnMobile
            />
            <Readout
              label="total"
              value={r.timings.total.toFixed(0)}
              unit="ms"
              highlight
            />
            {r.stats.pathCount === 0 && (
              <span className="flex h-full shrink-0 items-center border-l border-rule px-3 text-amber-400 lg:px-4">
                ⚠ <span className="ml-1 hidden sm:inline">線が検出されません</span>
              </span>
            )}
          </>
        )}
        {pipeline.status === "idle" && (
          <span className="flex h-full shrink-0 items-center border-l border-rule px-3 text-muted-foreground/60 lg:px-4">
            待機中
          </span>
        )}
      </div>

      <div className="hidden h-full items-center gap-3.5 pr-4 text-muted-foreground lg:flex">
        <span>
          <Kbd>1</Kbd>
          <Kbd>2</Kbd>
          <Kbd>3</Kbd>
          <Kbd>4</Kbd> プリセット
        </span>
        <span>
          <Kbd>⌘S</Kbd> 保存
        </span>
        <span className="flex items-center gap-2 border-l border-rule pl-3.5">
          <a
            href="https://github.com/maguro02/trace-line-web/blob/main/LICENSE"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-vellum"
          >
            MIT
          </a>
          <a
            href="https://github.com/maguro02/trace-line-web/blob/main/THIRD_PARTY_NOTICES.md"
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-vellum"
          >
            OSS
          </a>
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
  hideOnMobile,
}: {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
  hideOnMobile?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-full shrink-0 items-center gap-2 border-l border-rule px-3 lg:px-4",
        hideOnMobile && "hidden lg:flex",
      )}
    >
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
