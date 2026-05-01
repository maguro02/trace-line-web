# trace-line-web — 線画ベクター化 Web 版 PoC

ブラウザ完結（OpenCV.js + vectortracer / WASM）で線画を前処理してベクター化する PoC。
Python 版（`../trace-line/`）の `playground.py` と同等のパイプラインを TypeScript に移植したもの。

## 起動

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # 本番ビルド (dist/)
pnpm preview      # ビルド成果物の動作確認
```

## 使い方

1. ライブラリ状態 (OpenCV.js / vectortracer) が両方 `ready` になるまで待つ（初回 1〜3 秒）
2. 入力画像 (PNG / JPEG) をドロップ または クリックして選択
3. プリセット (v1〜v3 / 滑らか優先) で初期値を設定するか、スライダーで個別調整
4. パラメータ変更後 300ms で SVG が再生成される
5. 「SVG ダウンロード」で結果を保存

## 実装パイプライン

```
File → Canvas (白背景塗り) → ImageData
  → preprocess (OpenCV.js)
      grayscale → 二値化 → モルフォロジー → メディアン → スーパーサンプリング AA
  → vectorize (vectortracer / BinaryImageConverter)
  → SVG (DOMPurify で sanitize 後 DOM に挿入)
```

## 検証（PoC 合格基準）

Python 版と同じ画像・同じパラメータで以下を満たすこと:

1. **WASM ロード**
   - 起動後コンソールにエラーがない
   - `useOpenCV` / `useVTracer` の status が `ready` になる
2. **前処理一致** — v1 (バランス) で Python 版と視覚的に同等の前処理 PNG が出る（差は ±数ピクセル）
3. **SVG 品質** — v1〜v3 + 滑らか優先 × 画像 A/B/C で Python 版とパス数 ±10%、視覚的形状が同等
4. **応答性** — 1024×1024 画像でパラメータ確定後 1 秒以内に SVG 更新
5. **エッジケース** — 透明背景 PNG / 全白画像 / 巨大画像 (4096×4096) でクラッシュしない
6. **メモリリーク** — スライダーを 5 分連続操作しても WASM ヒープが線形成長しない
7. **SVG sanitize** — DOM Inspector で `script` 等の危険要素が挿入されていないこと

### Python 版との比較手順

```bash
# Python 版で参照画像を生成
cd ../trace-line
uv run vectorize.py /path/to/test.png --keep-intermediate -o /tmp/ref.svg

# Web 版を起動して同じ画像をアップロード、v1 プリセットを選択
cd ../trace-line-web
pnpm dev

# 中間 PNG (Python) と Web 版の前処理プレビューを目視で比較
# Python 版 SVG と Web 版 DL の SVG をパス数・形状で比較
```

## 既知の制約

- 入力は PNG / JPEG のみ。HEIC / AVIF / CMYK JPEG は未対応
- 推奨上限 4096×4096。それ以上は警告表示するが処理は試みる
- カラーモード (vectortracer の `color`) は未対応（PoC は線画 binary のみ）
- メインスレッドで処理するため、巨大画像では UI が一時的に固まる
- OpenCV.js の初回ダウンロードが大きい（~10MB / gzip ~3.5MB）

## 技術スタック

- **Vite 8** + **React 19** + **TypeScript 6**
- **Tailwind CSS 3** + **shadcn/ui** (Radix UI)
- **@techstark/opencv-js** 4.12 — OpenCV WASM
- **vectortracer** 0.1.2 — VTracer WASM (AlansCodeLog 製)
- **DOMPurify** — SVG sanitize
- **vite-plugin-wasm** — wasm-bindgen 形式の WASM 読み込み

## ディレクトリ構成

```
src/
├─ App.tsx                     ルートレイアウト
├─ lib/
│  ├─ types.ts                 型定義（PreprocessParams, VTracerParams ...）
│  ├─ presets.ts               プリセット (v1/v2/v3/滑らか優先)
│  ├─ opencv-loader.ts         OpenCV.js 動的ロード（キャッシュ済み Promise）
│  ├─ vtracer-loader.ts        vectortracer 動的ロード
│  ├─ preprocess.ts            前処理パイプライン（Mat の delete を try/finally で管理）
│  └─ vectorize.ts             vectortracer ラッパー（tick ループ）
├─ hooks/
│  ├─ useOpenCV.ts             ロード状態
│  ├─ useVTracer.ts            ロード状態
│  ├─ useDebouncedValue.ts     setTimeout ベースのデバウンス
│  └─ usePipeline.ts           前処理 + ベクター化 統合（キャンセル可）
└─ components/
   ├─ ui/                      shadcn/ui 自動生成
   ├─ ImageDropzone.tsx        D&D + Canvas 白背景描画 → ImageData
   ├─ PresetSelector.tsx
   ├─ ParamSlider.tsx          ラベル + 値表示 + Slider のラッパー
   ├─ PreprocessControls.tsx   前処理 8 スライダー
   ├─ VTracerControls.tsx      VTracer 6 スライダー + mode セレクト
   ├─ PreviewGrid.tsx          3 ペインプレビュー
   ├─ SvgPreview.tsx           SVG sanitize + DOM 挿入
   └─ DownloadButton.tsx       Blob URL でダウンロード
```

## ライセンス

本プロジェクトは [MIT License](./LICENSE) のもとで公開されている。Copyright (c) 2026 maguro02。

ビルド成果物には OpenCV.js (Apache-2.0) や vectortracer (MIT) などのサードパーティ OSS が同梱される。各依存ライブラリの著作権表示およびライセンスは [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md) を参照。
