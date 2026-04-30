import { useEffect, useRef, useState } from "react";
import { Maximize2, Minus, Plus } from "lucide-react";
import { SvgPreview } from "./SvgPreview";
import { cn } from "@/lib/utils";

type ViewMode = "svg" | "preprocess" | "compare";

interface Props {
  preprocessed: ImageData | null;
  svg: string;
  status: "idle" | "running" | "success" | "error";
  hasSource: boolean;
  ready: boolean;
}

function ImageDataCanvas({ data, className }: { data: ImageData; className?: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = data.width;
    canvas.height = data.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(data, 0, 0);
  }, [data]);
  return (
    <canvas ref={ref} className={cn("block max-h-full max-w-full object-contain", className)} />
  );
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;

export function PreviewGrid({ preprocessed, svg, status, hasSource, ready }: Props) {
  const [mode, setMode] = useState<ViewMode>("svg");
  const [zoom, setZoom] = useState(1);

  const fit = () => setZoom(1);
  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, +(z * 1.25).toFixed(3)));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, +(z / 1.25).toFixed(3)));

  const empty = !ready || !hasSource;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-rule px-3 py-2.5 sm:px-6 sm:py-3">
        <div
          className="inline-flex shrink-0 items-center gap-1 rounded-md border border-rule bg-ink-1 p-1"
          role="tablist"
        >
          <ViewModeButton active={mode === "preprocess"} onClick={() => setMode("preprocess")}>
            前処理
          </ViewModeButton>
          <ViewModeButton active={mode === "svg"} onClick={() => setMode("svg")}>
            SVG
          </ViewModeButton>
          <ViewModeButton active={mode === "compare"} onClick={() => setMode("compare")}>
            比較
          </ViewModeButton>
        </div>

        <div className="flex shrink-0 items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className="hidden sm:inline">表示</span>
          <div className="inline-flex items-center overflow-hidden rounded border border-rule">
            <ZoomBtn onClick={zoomOut} aria="縮小">
              <Minus className="h-3.5 w-3.5" />
            </ZoomBtn>
            <span className="grid h-7 min-w-[56px] place-items-center border-x border-rule bg-ink-2 px-2 text-vellum sm:min-w-[72px]">
              {Math.round(zoom * 100)} %
            </span>
            <ZoomBtn onClick={zoomIn} aria="拡大">
              <Plus className="h-3.5 w-3.5" />
            </ZoomBtn>
            <ZoomBtn onClick={fit} aria="フィット">
              <Maximize2 className="h-3.5 w-3.5" />
            </ZoomBtn>
          </div>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden bg-background">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--vellum) / 0.05) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--vellum) / 0.05) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage:
              "radial-gradient(ellipse at center, black 50%, transparent 92%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 50%, transparent 92%)",
          }}
          aria-hidden
        />
        <span className="reg-mark left-4 top-4" aria-hidden />
        <span className="reg-mark right-4 top-4" aria-hidden />
        <span className="reg-mark bottom-4 left-4" aria-hidden />
        <span className="reg-mark bottom-4 right-4" aria-hidden />

        {empty ? (
          <EmptyState ready={ready} hasSource={hasSource} />
        ) : (
          <div className="absolute inset-0 grid place-items-center overflow-auto p-8">
            <div className="relative origin-center" style={{ transform: `scale(${zoom})` }}>
              {mode === "svg" && (
                <Frame status={status}>
                  {svg ? (
                    <SvgPreview svg={svg} className="block h-full w-full" />
                  ) : (
                    <PendingPlaceholder label="ベクター化結果" />
                  )}
                </Frame>
              )}

              {mode === "preprocess" && (
                <Frame status={status}>
                  {preprocessed ? (
                    <ImageDataCanvas data={preprocessed} className="bg-white" />
                  ) : (
                    <PendingPlaceholder label="前処理結果" />
                  )}
                </Frame>
              )}

              {mode === "compare" && (
                <CompareFrame status={status} preprocessed={preprocessed} svg={svg} />
              )}
            </div>
          </div>
        )}

        {mode === "svg" && preprocessed && status !== "idle" && (
          <div className="pointer-events-none absolute bottom-3 right-3 w-[110px] overflow-hidden rounded-md border border-rule bg-ink-2 shadow-2xl sm:bottom-6 sm:right-6 sm:w-[160px]">
            <div className="flex items-center justify-between border-b border-rule px-2 py-1.5">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                前処理
              </span>
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  status === "running"
                    ? "animate-pulse-soft bg-accent-soft"
                    : status === "error"
                      ? "bg-destructive"
                      : "bg-emerald-400",
                )}
              />
            </div>
            <div className="checker-sm grid aspect-[4/3] place-items-center">
              <ImageDataCanvas data={preprocessed} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ViewModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded px-3 py-1.5 text-[11px] font-medium tracking-wide transition-colors",
        active ? "bg-ink-3 text-vellum" : "text-muted-foreground hover:text-vellum-dim",
      )}
    >
      {children}
    </button>
  );
}

function ZoomBtn({
  onClick,
  aria,
  children,
}: {
  onClick: () => void;
  aria: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria}
      className="grid h-7 w-7 place-items-center bg-ink-1 text-vellum-dim transition-colors hover:text-accent"
    >
      {children}
    </button>
  );
}

function Frame({
  children,
  status,
}: {
  children: React.ReactNode;
  status: Props["status"];
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-vellum shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7),0_0_0_1px_hsl(var(--rule-strong))] transition-opacity",
        status === "running" && "opacity-80",
      )}
      style={{ maxWidth: "min(960px, 100%)", maxHeight: "min(80vh, 100%)" }}
    >
      {children}
      {status === "running" && (
        <>
          <div
            className="pointer-events-none absolute left-0 right-0 top-0 h-[2px] origin-left bg-accent"
            style={{
              boxShadow: "0 0 12px hsl(var(--accent))",
              animation: "scan 1.6s ease-in-out infinite",
            }}
            aria-hidden
          />
          <style>{`@keyframes scan { 0%,100% { transform: translateX(-100%); } 50% { transform: translateX(100%); } }`}</style>
        </>
      )}
    </div>
  );
}

function PendingPlaceholder({ label }: { label: string }) {
  return (
    <div className="grid aspect-[4/3] w-[480px] place-items-center bg-vellum">
      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        {label} を処理中…
      </span>
    </div>
  );
}

function EmptyState({ ready, hasSource }: { ready: boolean; hasSource: boolean }) {
  return (
    <div className="grid h-full place-items-center px-6">
      <div className="max-w-md text-center">
        <h2 className="font-display text-3xl leading-tight text-vellum">
          {!ready ? "ライブラリを読み込み中" : !hasSource ? "線画を投入してください" : ""}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {!ready
            ? "OpenCV.js と vectortracer の WASM を初回ダウンロード中（約 10 MB）。完了後にプリセットが選べるようになります。"
            : "左パネルにドロップ、または クリックしてファイルを選択。PNG / JPEG のラスタ画像を SVG ベクターに変換します。"}
        </p>
        {ready && !hasSource && (
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.2em] text-accent">
            <span className="hidden lg:inline">← 左パネルから入力</span>
            <span className="lg:hidden">↑ 上部から画像を選択</span>
          </p>
        )}
      </div>
    </div>
  );
}

function CompareFrame({
  status,
  preprocessed,
  svg,
}: {
  status: Props["status"];
  preprocessed: ImageData | null;
  svg: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState(50);
  const dragging = useRef(false);

  const move = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, pct)));
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      move(e.clientX);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!dragging.current || !e.touches[0]) return;
      move(e.touches[0].clientX);
    };
    const stop = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stop);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", stop);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", stop);
    };
  }, []);

  if (!preprocessed && !svg) {
    return <PendingPlaceholder label="比較" />;
  }

  return (
    <div
      ref={ref}
      onMouseDown={(e) => {
        dragging.current = true;
        move(e.clientX);
      }}
      onTouchStart={(e) => {
        dragging.current = true;
        if (e.touches[0]) move(e.touches[0].clientX);
      }}
      className={cn(
        "relative aspect-[4/3] w-[min(960px,80vw)] cursor-ew-resize select-none overflow-hidden bg-vellum",
        "shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7),0_0_0_1px_hsl(var(--rule-strong))]",
        status === "running" && "opacity-80",
      )}
    >
      <div className="absolute inset-0 grid place-items-center bg-vellum">
        {preprocessed ? <ImageDataCanvas data={preprocessed} /> : null}
      </div>
      <div
        className="absolute inset-0 grid place-items-center bg-vellum"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        {svg && <SvgPreview svg={svg} className="block h-full w-full" />}
      </div>
      <span className="absolute left-3 top-3 rounded bg-black/80 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-vellum">
        前処理
      </span>
      <span className="absolute right-3 top-3 rounded bg-black/80 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-accent-soft">
        SVG
      </span>
      <div
        className="absolute bottom-0 top-0 w-px bg-accent"
        style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
      >
        <span className="absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-vellum text-accent shadow-lg">
          ↔
        </span>
      </div>
    </div>
  );
}
