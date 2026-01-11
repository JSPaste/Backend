import type { RolldownOptions } from "rolldown";
import { analyzer, unstableRolldownAdapter } from "vite-bundle-analyzer";

const analyze = false;

export default {
  input: "./src/index.ts",
  output: {
    file: "./dist/backend.js",
    format: "es",
    inlineDynamicImports: true,
    legalComments: "none",
    minify: true,
    sourcemap: true
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
  transform: {
    // deno.json compilerOptions
    typescript: {
      onlyRemoveTypeImports: true
    }
  },
  plugins: [
    unstableRolldownAdapter(
      analyzer({
        enabled: analyze,
        analyzerPort: "auto",
        summary: true
      })
    )
  ]
} satisfies RolldownOptions;
