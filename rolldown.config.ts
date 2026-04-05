import type { RolldownOptions } from "rolldown";
import { bundleAnalyzerPlugin } from "rolldown/experimental";

import { deno } from "./rolldown.deno.ts";

export default {
  input: "./src/index.ts",
  output: {
    file: "./dist/backend.js",
    comments: false,
    sourcemap: true,
    minify: true,
    codeSplitting: false,
    topLevelVar: true
  },
  platform: "neutral",
  moduleTypes: {
    ".sql": "text"
  },
  plugins: [
    deno(),
    bundleAnalyzerPlugin({
      fileName: "metadata.json"
    })
  ]
} satisfies RolldownOptions;
