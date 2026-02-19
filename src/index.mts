import { configure } from "arktype/config";
import "@std/dotenv/load";

declare global {
  // biome-ignore lint/style/useConsistentTypeDefinitions: expected
  interface ArkEnv {
    meta(): {
      ref?: string;
    };
  }
}

configure({
  toJsonSchema: {
    fallback: {
      morph: (ctx) => ctx.out ?? ctx.base
    }
  }
});

void import("./init.mts").then(({ init }) => init());
