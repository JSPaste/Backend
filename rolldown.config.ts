import type { RolldownOptions } from "rolldown";

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
    conditionNames: ["import", "require", "node", "default"],
    mainFields: ["main", "module"]
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
  }
} satisfies RolldownOptions;
