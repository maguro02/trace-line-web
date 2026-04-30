import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRESETS } from "@/lib/presets";
import type { AllParams } from "@/lib/types";

interface Props {
  current: AllParams;
  onApply: (params: AllParams) => void;
}

export function PresetSelector({ current, onApply }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <Label>プリセット</Label>
      <Select
        onValueChange={(id) => {
          const preset = PRESETS.find((p) => p.id === id);
          if (!preset) return;
          onApply({
            preprocess: { ...current.preprocess, ...preset.preprocess },
            vtracer: { ...current.vtracer, ...preset.vtracer },
          });
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="選択するとパラメータが上書きされます" />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
