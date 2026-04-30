import { useCallback } from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  svg: string;
  fileName: string;
  disabled?: boolean;
}

export function DownloadButton({ svg, fileName, disabled }: Props) {
  const handleClick = useCallback(() => {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [svg, fileName]);

  const isDisabled = disabled || !svg;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        "group inline-flex items-center gap-2 rounded px-3.5 py-2 text-[12px] font-medium tracking-wide transition-all",
        isDisabled
          ? "cursor-not-allowed bg-ink-3 text-muted-foreground"
          : "bg-accent text-accent-foreground shadow-[0_8px_20px_-10px_hsl(var(--accent)/0.7),inset_0_1px_0_hsl(var(--accent-soft)/0.4)] hover:-translate-y-px",
      )}
    >
      <Download className="h-4 w-4" />
      SVG をダウンロード
      <span
        className={cn(
          "rounded px-1.5 py-0.5 font-mono text-[9px]",
          isDisabled ? "bg-black/0" : "bg-black/20 text-accent-foreground/80",
        )}
      >
        ⌘S
      </span>
    </button>
  );
}
