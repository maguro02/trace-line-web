import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages では https://<user>.github.io/<repo>/ 配下に配信されるため、
  // assets と Worker URL がリポジトリ名のサブパスで解決されるよう base を設定する。
  // (Worker / OpenCV.js は import.meta.env.BASE_URL で参照する)
  base: "/trace-line-web/",
  plugins: [react(), wasm()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    // vectortracer は wasm-bindgen 形式で vite-plugin-wasm に処理させたいので除外。
    // OpenCV.js は public/opencv.js を Worker から importScripts で直接読むため、
    // バンドル対象には入らない (ESM 変換不要)。
    exclude: ["vectortracer"],
  },
  build: {
    target: "es2022",
  },
});
