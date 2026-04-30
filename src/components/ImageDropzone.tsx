import { useCallback, useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onChange: (data: { imageData: ImageData; previewUrl: string; fileName: string }) => void;
  className?: string;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg"];

/**
 * 画像のドラッグ&ドロップ + クリック選択。
 * 内部で Canvas に白背景塗り → drawImage を行うため、出力 ImageData は
 * 透明背景が白に置換された RGBA バイト列になる（Python 版の to_grayscale と等価）。
 */
export function ImageDropzone({ onChange, className }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [hover, setHover] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`未対応の形式です: ${file.type || "(unknown)"} — PNG / JPEG のみ受け付けます`);
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
          // 白背景塗り
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          onChange({ imageData, previewUrl: url, fileName: file.name });
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

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setHover(true);
        }}
        onDragLeave={() => setHover(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-8 text-center transition-colors",
          hover
            ? "border-primary bg-accent"
            : "border-muted-foreground/30 hover:border-primary/50",
        )}
      >
        <ImagePlus className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="font-medium">画像をドロップ または クリックして選択</p>
        <p className="text-sm text-muted-foreground">PNG / JPEG（最大 4096×4096 推奨）</p>
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
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
