import { useCallback } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  return (
    <Button onClick={handleClick} disabled={disabled || !svg}>
      <Download className="mr-2 h-4 w-4" />
      SVG ダウンロード
    </Button>
  );
}
