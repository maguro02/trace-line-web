import { useCallback, useRef, useState } from "react";
import { ImagePlus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropzoneFile {
  imageData: ImageData;
  previewUrl: string;
  fileName: string;
  fileSize: number;
}

interface Props {
  onChange: (data: DropzoneFile) => void;
  current: { previewUrl: string | null; fileName: string; fileSize: number; width: number; height: number } | null;
  className?: string;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg"];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * 画像のドラッグ&ドロップ + クリック選択。
 * アップロード後はそのままサムネイル + メタ情報 + 差し替えボタンに切り替わる。
 */
export function ImageDropzone({ onChange, current, className }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [hover, setHover] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`未対応の形式: ${file.type || "(unknown)"} — PNG / JPEG のみ`);
        return;
      }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            setError("Canvas 2D コンテキストを取得できません");
            return;
          }
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          onChange({ imageData, previewUrl: url, fileName: file.name, fileSize: file.size });
        } catch (e: unknown) {
          setError(`画像の処理中にエラー: ${String(e)}`);
        }
      };
      img.onerror = () => {
        setError("画像のデコードに失敗しました（破損 / 未対応形式の可能性）");
        URL.revokeObjectURL(url);
      };
      img.src = url;
    },
    [onChange],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setHover(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const openPicker = () => inputRef.current?.click();

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {current ? (
        <div className="overflow-hidden rounded-md border border-rule bg-ink-2">
          <div className="checker relative aspect-[4/3] w-full overflow-hidden">
            {current.previewUrl && (
              <img
                src={current.previewUrl}
                alt={current.fileName}
                className="h-full w-full object-contain"
              />
            )}
            <span className="reg-mark left-1.5 top-1.5" aria-hidden />
            <span className="reg-mark right-1.5 top-1.5" aria-hidden />
            <span className="reg-mark bottom-1.5 left-1.5" aria-hidden />
            <span className="reg-mark bottom-1.5 right-1.5" aria-hidden />
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-rule px-3 py-2">
            <div className="flex min-w-0 flex-col leading-tight">
              <span
                className="truncate text-[12px] font-medium text-vellum"
                title={current.fileName}
              >
                {current.fileName}
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {current.width} × {current.height} · {formatBytes(current.fileSize)}
              </span>
            </div>
            <button
              onClick={openPicker}
              className="inline-flex items-center gap-1.5 rounded border border-rule-strong px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-vellum-dim transition-colors hover:border-accent hover:text-accent"
            >
              <RefreshCw className="h-3 w-3" />
              差し替え
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={openPicker}
          onDragOver={(e) => {
            e.preventDefault();
            setHover(true);
          }}
          onDragLeave={() => setHover(false)}
          onDrop={onDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-[1.5px] border-dashed px-4 py-8 text-center transition-colors",
            "bg-[repeating-linear-gradient(45deg,transparent_0,transparent_10px,hsl(var(--vellum)/0.012)_10px,hsl(var(--vellum)/0.012)_11px)] bg-ink-1",
            hover
              ? "border-accent"
              : "border-rule-strong hover:border-accent/60",
          )}
        >
          <div className="grid h-10 w-10 place-items-center rounded-md border border-rule-strong text-vellum-dim">
            <ImagePlus className="h-5 w-5" />
          </div>
          <p className="font-display text-[15px]">画像をドロップ</p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            または クリックして選択
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            PNG / JPEG · 推奨 4096 × 4096 まで
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
