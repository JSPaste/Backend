import { abortable } from "@std/async";
import { ensureDir } from "@std/fs";

import { Database } from "#db/index.ts";
import { handler } from "#http/handler.ts";
import { http } from "#http/index.ts";
import { sweeper } from "#task/sweeper.ts";
import { Logger } from "#util/console.ts";
import { env } from "#util/env.ts";

import { constantPathStructStorage, constantPathStructStorageData, constantStoreDispose, mutable } from "./global.ts";
import { taskRegister } from "./task.ts";

const log: Logger = new Logger();

let shutdown = false;

const initDirStruct = async (): Promise<void> => {
  await Promise.all([ensureDir(constantPathStructStorage), ensureDir(constantPathStructStorageData)]);
};

const initHTTPServer = async (handler?: Deno.ServeHandler<Deno.Addr>): Promise<void> => {
  const id = "__httpServer";

  await constantStoreDispose.get(id)?.[1]();

  mutable.http = http({
    handler: handler
  });

  constantStoreDispose.set(id, [
    10,
    async (): Promise<void> => {
      mutable.http?.unref();

      // Deno.serve will deadlock on shutdown under pressure
      await mutable.http?.shutdown();
    }
  ]);
};

const initDatabase = async (): Promise<void> => {
  const id = "__databaseServer";

  await constantStoreDispose.get(id)?.[1]();

  mutable.database = new Database();

  constantStoreDispose.set(id, [0, async (): Promise<void> => mutable.database[Symbol.dispose]()]);

  await mutable.database.migration();
};

const initTask = async (): Promise<void> => {
  taskRegister(env.JSPB_TASK_SWEEPER, sweeper, {
    name: "sweeper"
  });
};

export const init = async (): Promise<void> => {
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP", "SIGUSR1", "SIGUSR2"] satisfies Deno.Signal[]) {
    Deno.addSignalListener(signal, async () => {
      if (shutdown) return;
      shutdown = true;

      log.debug(`Received ${signal}.`);

      const storeDispose = constantStoreDispose
        .entries()
        .toArray()
        .sort(([, [pa]], [, [pb]]) => pb - pa);

      try {
        for (const [key, [, dispose]] of storeDispose) {
          log.debug(`Closing "${key}"...`);

          try {
            await abortable(dispose(), AbortSignal.timeout(3000));
          } catch {
            log.warn(`Couldn't close "${key}" on time.`);
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
    await Promise.all([initTask(), initHTTPServer(handler().fetch)]);
  } catch (error) {
    log.error(error);

    Deno.exitCode = 1;
    Deno.kill(Deno.pid, "SIGTERM");
  }
};
