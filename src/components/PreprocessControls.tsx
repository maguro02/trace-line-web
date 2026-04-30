import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ParamSlider } from "./ParamSlider";
import type { PreprocessParams } from "@/lib/types";

interface Props {
  params: PreprocessParams;
  onChange: (params: PreprocessParams) => void;
}

export function PreprocessControls({ params, onChange }: Props) {
  const set = <K extends keyof PreprocessParams>(key: K, value: PreprocessParams[K]) =>
    onChange({ ...params, [key]: value });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm">Otsu 自動しきい値</Label>
        <Switch
          checked={params.useOtsu}
          onCheckedChange={(v) => set("useOtsu", v)}
        />
      </div>
      <ParamSlider
        label="固定しきい値（Otsu OFF 時）"
        value={params.fixedThreshold}
        min={0}
        max={255}
        step={1}
        onChange={(v) => set("fixedThreshold", v)}
      />
      <ParamSlider
        label="モルフォロジー カーネル（奇数）"
        value={params.morphKsize}
        min={1}
        max={9}
        step={2}
        onChange={(v) => set("morphKsize", v)}
      />
      <ParamSlider
        label="Close 反復（凹みを埋める）"
        value={params.morphCloseIter}
        min={0}
        max={5}
        step={1}
        onChange={(v) => set("morphCloseIter", v)}
      />
      <ParamSlider
        label="Open 反復（飛び出しを削る）"
        value={params.morphOpenIter}
        min={0}
        max={5}
        step={1}
        onChange={(v) => set("morphOpenIter", v)}
      />
      <ParamSlider
        label="メディアン カーネル（0=無効、偶数は奇数化）"
        value={params.medianKsize}
        min={0}
        max={9}
        step={1}
        onChange={(v) => set("medianKsize", v)}
      />
      <ParamSlider
        label="AA 拡大倍率"
        value={params.upscale}
        min={1}
        max={8}
        step={1}
        onChange={(v) => set("upscale", v)}
      />
      <ParamSlider
        label="AA ぼかし sigma"
        value={params.blurSigma}
        min={0}
        max={4}
        step={0.1}
        onChange={(v) => set("blurSigma", v)}
        format={(v) => v.toFixed(1)}
      />
    </div>
  );
}
