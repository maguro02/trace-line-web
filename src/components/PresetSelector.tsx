import { PRESETS } from "@/lib/presets";
import type { AllParams } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Props {
  current: AllParams;
  activeId: string | null;
  onApply: (id: string, params: AllParams) => void;
}

export function PresetSelector({ current, activeId, onApply }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PRESETS.map((p) => {
        const active = p.id === activeId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() =>
              onApply(p.id, {
                preprocess: { ...current.preprocess, ...p.preprocess },
                vtracer: { ...current.vtracer, ...p.vtracer },
              })
            }
            className={cn(
              "group relative flex flex-col gap-1 rounded-md border px-3 py-2.5 text-left transition-all",
              active
                ? "border-accent bg-gradient-to-b from-accent/10 to-transparent"
                : "border-rule bg-ink-1 hover:border-rule-strong hover:bg-ink-2",
            )}
          >
            {active && (
              <span
                className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent"
                aria-hidden
              />
            )}
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
              {p.tag}
            </span>
            <span className="font-display text-[14px] leading-none text-vellum">
              {p.name}
            </span>
            <span className="text-[11px] leading-snug text-muted-foreground">
              {p.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
