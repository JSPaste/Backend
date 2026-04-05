import { init } from "./init.ts";

import "@std/dotenv/load";

declare global {
  // oxlint-disable-next-line typescript-eslint/consistent-type-definitions: expected
  interface ArkEnv {
    meta(): {
      ref?: string;
    };
  }
}

void init();
