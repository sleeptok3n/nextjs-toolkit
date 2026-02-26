import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "middleware/index": "src/middleware/index.ts",
    "api/index": "src/api/index.ts",
    "cache/index": "src/cache/index.ts",
    "config/index": "src/config/index.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ["next", "react"],
});
