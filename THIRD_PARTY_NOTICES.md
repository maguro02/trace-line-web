# Third-Party Notices

`trace-line-web` をビルド・配布するにあたって同梱しているサードパーティ・オープンソースソフトウェアの著作権およびライセンスを以下に記載する。各依存ライブラリの権利は本プロジェクトのライセンス（MIT）ではなく、それぞれの著作権者および以下に示すライセンスに帰属する。

依存関係の完全な一覧は `package.json` および `pnpm-lock.yaml` を参照。トランジティブ依存（自身の依存ライブラリがさらに依存するもの）の表記は省略するが、いずれも MIT、Apache-2.0、ISC、BSD などの寛容ライセンスであり、フルテキストは `node_modules/<pkg>/LICENSE` で確認できる。

---

## 直接配布しているコンポーネント

### OpenCV.js (`public/opencv.js`)

- 著作権者: OpenCV team およびコントリビューター
- ライセンス: Apache License 2.0
- 配布元: https://github.com/opencv/opencv
- 本プロジェクト内の所在: `public/opencv.js`（ビルド成果物 `dist/opencv.js` として配信される）

```
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   Copyright (c) OpenCV team and contributors

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
```

---

## バンドルしている npm 依存（実行時）

ビルド時に Vite によって `dist/assets/*.js` へバンドルされ、エンドユーザーへ配布されるランタイム依存。

### vectortracer

- バージョン: 0.1.2
- ライセンス: MIT
- 著作権者: Alan North <alanscodelog@gmail.com>
- 配布元: https://github.com/AlansCodeLog/vectortracer
- 補足: 内部的に visioncortex 製の VTracer (https://github.com/visioncortex/vtracer, MIT License, Copyright (c) 2020 visioncortex) を WASM へコンパイルしたものを利用している。

### React / React DOM

- バージョン: 19.2.5
- ライセンス: MIT
- 著作権者: Meta Platforms, Inc. and affiliates
- 配布元: https://github.com/facebook/react

### Radix UI (`@radix-ui/react-label`, `react-select`, `react-separator`, `react-slider`, `react-slot`, `react-switch`)

- ライセンス: MIT
- 著作権者: WorkOS, Inc.（旧 Modulz）
- 配布元: https://github.com/radix-ui/primitives

### DOMPurify

- バージョン: 3.4.1
- ライセンス: Mozilla Public License 2.0 または Apache License 2.0（デュアルライセンス。本プロジェクトでは Apache-2.0 を選択）
- 著作権者: Dr.-Ing. Mario Heiderich, Cure53
- 配布元: https://github.com/cure53/DOMPurify

### class-variance-authority

- バージョン: 0.7.1
- ライセンス: Apache License 2.0
- 著作権者: Joe Bell
- 配布元: https://github.com/joe-bell/cva

### clsx

- バージョン: 2.1.1
- ライセンス: MIT
- 著作権者: Luke Edwards
- 配布元: https://github.com/lukeed/clsx

### tailwind-merge

- バージョン: 3.5.0
- ライセンス: MIT
- 著作権者: Dany Castillo
- 配布元: https://github.com/dcastil/tailwind-merge

### tailwindcss-animate

- バージョン: 1.0.7
- ライセンス: MIT
- 著作権者: Jamie Kyle
- 配布元: https://github.com/jamiebuilds/tailwindcss-animate

### lucide-react

- バージョン: 1.14.0
- ライセンス: ISC
- 著作権者: Lucide Contributors
- 配布元: https://github.com/lucide-icons/lucide

### shadcn/ui

- 取り込みコード: `src/components/ui/*`
- ライセンス: MIT
- 著作権者: shadcn (https://github.com/shadcn-ui/ui)
- 補足: shadcn/ui はテンプレートとしてプロジェクト内に取り込んで利用するスタイルのライブラリであり、生成コードは MIT ライセンス下で配布される。

---

## ビルド時にのみ使用するツール

以下は本プロジェクトのソース/ビルドの生成にのみ使用され、配布物そのものには含まれない。完全な著作権・ライセンステキストは `node_modules/<pkg>/LICENSE` を参照。

- Vite (MIT) — https://github.com/vitejs/vite
- TypeScript (Apache-2.0) — https://github.com/microsoft/TypeScript
- Tailwind CSS (MIT) — https://github.com/tailwindlabs/tailwindcss
- PostCSS / Autoprefixer (MIT)
- ESLint および typescript-eslint (MIT)
- vite-plugin-wasm / vite-plugin-top-level-await (MIT)

---

## 外部サービス

以下はビルド成果物に同梱されず、ブラウザ実行時に CDN からロードされるリソース。再配布行為に当たらないため本ファイルでは表記対象外だが、参考として記載する。

- Google Fonts: Inter Tight (SIL Open Font License 1.1) / JetBrains Mono (SIL Open Font License 1.1)

---

完全な依存ツリーの一覧およびライセンスは、リポジトリのルートで以下のコマンドにより取得できる。

```bash
pnpm licenses list
```
