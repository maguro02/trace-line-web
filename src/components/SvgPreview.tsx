import { useMemo } from "react";
import DOMPurify from "dompurify";

interface Props {
  svg: string;
  className?: string;
}

/**
 * SVG 文字列を DOMPurify でサニタイズしてから DOM に挿入する。
 * 挿入前の sanitize により script/foreignObject 等の危険要素は除去される。
 */
export function SvgPreview({ svg, className }: Props) {
  const sanitized = useMemo(() => {
    if (!svg) return "";
    return DOMPurify.sanitize(svg, {
      USE_PROFILES: { svg: true, svgFilters: true },
    });
  }, [svg]);

  if (!svg) {
    return (
      <div
        className={`flex items-center justify-center text-sm text-muted-foreground ${className ?? ""}`}
      >
        SVG なし
      </div>
    );
  }

  // sanitize 済み文字列のみ DOM に挿入する。
  return (
    <div
      className={`[&_svg]:block [&_svg]:h-auto [&_svg]:w-full ${className ?? ""}`}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
