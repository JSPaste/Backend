import type { RolldownOptions } from "rolldown";
import { bundleAnalyzerPlugin } from "rolldown/experimental";
import deno from "./lib/deno-rolldown/mod.mts";

const analyze = false;

export default {
  input: "./src/index.mts",
  output: {
    file: "./dist/backend.js",
    legalComments: "none",
    sourcemap: true,
    minify: true,
    codeSplitting: false,
    topLevelVar: true
  },
  platform: "neutral",
  moduleTypes: {
    ".sql": "text"
  },
  optimization: {
    inlineConst: true
  },
  plugins: [
    deno(),
    analyze &&
      bundleAnalyzerPlugin({
        fileName: "metadata.json"
      })
  ]
} satisfies RolldownOptions;
