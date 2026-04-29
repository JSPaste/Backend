import { abortable } from "@std/async";
import { warmupSimd as initCrypto } from "blake3-jit";

import { constantStoreDispose } from "#/global.ts";
import { initDatabase, initDirStruct, initHTTPServer, initTask, initUnhashedTokenCheck } from "#/init.ts";
import { handler } from "#http/handler.ts";
import { Logger } from "#util/console.ts";

import "@std/dotenv/load";

declare global {
  // oxlint-disable-next-line typescript-eslint/consistent-type-definitions: expected
  interface ArkEnv {
    meta(): {
      ref?: string;
    };
  }
}

const log: Logger = new Logger();

let shutdown = false;

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP", "SIGUSR1", "SIGUSR2"] satisfies Deno.Signal[]) {
  Deno.addSignalListener(signal, async () => {
    if (shutdown) return;
    shutdown = true;

    log.debug(`Received ${signal}.`);

    const storeDispose = constantStoreDispose
      .entries()
      .toArray()
      .sort(([, { priority: a }], [, { priority: b }]) => b - a);

    try {
      for (const [key, { run }] of storeDispose) {
        log.debug(`Closing "${key}"...`);

        try {
          const value = run();
          if (value instanceof Promise) {
            await abortable(value, AbortSignal.timeout(3000));
          }
        } catch {
          throw new Error(`Couldn't close "${key}" on time.`);
        }
      }
    } catch (error) {
      log.error("Failed to gracefully shutdown (bad state)..:", error);
      Deno.exit(1);
    }

    if (Deno.exitCode === 0) {
      log.info("Bye.");
    }
  });
}

try {
  await Promise.all([initDirStruct(), initHTTPServer()]);
  await initDatabase();
  initUnhashedTokenCheck();
  initTask();
  await initHTTPServer(handler().fetch);
  initCrypto();
} catch (error) {
  log.error(error);

  Deno.exitCode = 1;
  Deno.kill(Deno.pid, "SIGTERM");
}
