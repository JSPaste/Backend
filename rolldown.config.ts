import type { RolldownOptions } from "rolldown";
import { analyzer, unstableRolldownAdapter } from "vite-bundle-analyzer";
import deno from "./lib/deno-rolldown/mod.ts";

const analyze = false;

export default {
  input: "./src/index.ts",
  output: {
    file: "./dist/backend.js",
    format: "es",
    legalComments: "none",
    sourcemap: true,
    minify: true,
    codeSplitting: false,
    topLevelVar: true
  },
  resolve: {
    conditionNames: ["import", "default"],
    mainFields: ["module", "main"]
  },
  platform: "neutral",
  external: [/^(node:)/],
  moduleTypes: {
    ".sql": "text"
  },
  optimization: {
    inlineConst: true
  },
  plugins: [
    deno(),
    unstableRolldownAdapter(
      analyzer({
        enabled: analyze,
        analyzerPort: "auto",
        summary: true
      })
    )
  ]
} satisfies RolldownOptions;
