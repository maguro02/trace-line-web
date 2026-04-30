import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ParamSlider } from "./ParamSlider";
import type { VTracerMode, VTracerParams } from "@/lib/types";

interface Props {
  params: VTracerParams;
  onChange: (params: VTracerParams) => void;
}

export function VTracerControls({ params, onChange }: Props) {
  const set = <K extends keyof VTracerParams>(key: K, value: VTracerParams[K]) =>
    onChange({ ...params, [key]: value });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm">モード</Label>
        <Select
          value={params.mode}
          onValueChange={(v) => set("mode", v as VTracerMode)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="spline">spline (ベジェ曲線)</SelectItem>
            <SelectItem value="polygon">polygon (折れ線)</SelectItem>
            <SelectItem value="none">none (ピクセル境界)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ParamSlider
        label="filter_speckle (ノイズ最小面積)"
        value={params.filterSpeckle}
        min={0}
        max={32}
        step={1}
        onChange={(v) => set("filterSpeckle", v)}
      />
      <ParamSlider
        label="corner_threshold (角検出, 度)"
        value={params.cornerThreshold}
        min={0}
        max={180}
        step={1}
        onChange={(v) => set("cornerThreshold", v)}
      />
      <ParamSlider
        label="length_threshold (短セグメント統合)"
        value={params.lengthThreshold}
        min={0}
        max={10}
        step={0.5}
        onChange={(v) => set("lengthThreshold", v)}
        format={(v) => v.toFixed(1)}
      />
      <ParamSlider
        label="splice_threshold (パス連結, 度)"
        value={params.spliceThreshold}
        min={0}
        max={180}
        step={1}
        onChange={(v) => set("spliceThreshold", v)}
      />
      <ParamSlider
        label="path_precision (座標小数桁数)"
        value={params.pathPrecision}
        min={0}
        max={8}
        step={1}
        onChange={(v) => set("pathPrecision", v)}
      />
    </div>
  );
}
