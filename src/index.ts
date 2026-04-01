import { configure } from "arktype/config";
import "@std/dotenv/load";

declare global {
  // oxlint-disable-next-line typescript-eslint/consistent-type-definitions: expected
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

void import("./init.ts").then(({ init }) => init());
