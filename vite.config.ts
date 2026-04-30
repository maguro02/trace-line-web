import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
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
