import { useEffect, useRef } from "react";
import { SvgPreview } from "./SvgPreview";

interface Props {
  originalUrl: string | null;
  preprocessed: ImageData | null;
  svg: string;
}

function ImageDataCanvas({ data }: { data: ImageData }) {
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

  return <canvas ref={ref} className="block h-auto w-full" />;
}

function Pane({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-col gap-2 rounded-md border bg-card p-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-muted/30 p-2">
        {children}
      </div>
    </div>
  );
}

export function PreviewGrid({ originalUrl, preprocessed, svg }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <Pane title="元画像">
        {originalUrl ? (
          <img src={originalUrl} alt="元画像" className="block h-auto w-full" />
        ) : (
          <span className="text-sm text-muted-foreground">画像未選択</span>
        )}
      </Pane>
      <Pane title="前処理結果（VTracer 入力）">
        {preprocessed ? (
          <ImageDataCanvas data={preprocessed} />
        ) : (
          <span className="text-sm text-muted-foreground">未処理</span>
        )}
      </Pane>
      <Pane title="SVG プレビュー">
        <SvgPreview svg={svg} className="h-full w-full" />
      </Pane>
    </div>
  );
}
