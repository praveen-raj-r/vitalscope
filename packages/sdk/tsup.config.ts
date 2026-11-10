import { defineConfig } from "tsup";

export default defineConfig([
  { entry: ["src/index.ts"], format: ["esm"], dts: true, minify: true, clean: true, target: "es2020" },
  {
    entry: { vitalscope: "src/index.ts" },
    format: ["iife"],
    globalName: "Vitalscope",
    minify: true,
    target: "es2020",
  },
]);
