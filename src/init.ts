import { abortable } from "@std/async";
import { ensureDir } from "@std/fs";
import { Database } from "#db/database.ts";
import { router } from "#http/router.ts";
import { server } from "#http/server.ts";
import { sweeper } from "#task/sweeper.ts";
import { Logger } from "#util/console.ts";
import { constant, mutable } from "./global.ts";
import { taskRegister } from "./task.ts";

const log: Logger = new Logger();

const initDirStruct = async (): Promise<void> => {
  const paths = Object.values(constant.path.struct);

  await Promise.all(paths.map((path) => ensureDir(path)));
};

const initHTTPServer = async (handler?: Deno.ServeHandler<Deno.Addr>): Promise<void> => {
  const id = "__httpServer";

  await constant.store.dispose.get(id)?.[1]();

  mutable.http = server({
    handler: handler
  });

  constant.store.dispose.set(id, [
    10,
    async () => {
      mutable.http?.unref();

      // Deno.serve will deadlock on shutdown under pressure
      await mutable.http?.shutdown();
    }
  ]);
};

const initDatabase = async (): Promise<void> => {
  const id = "__databaseServer";

  await constant.store.dispose.get(id)?.[1]();

  mutable.database = new Database();

  constant.store.dispose.set(id, [0, async () => mutable.database[Symbol.dispose]()]);

  mutable.database.migration();

  if (constant.env.JSPB_USER_ROOT_TOKEN) {
    mutable.database.user.update("id", constant.ulid.userRoot, "token", constant.env.JSPB_USER_ROOT_TOKEN);
  }
};

const initTask = async (): Promise<void> => {
  taskRegister(constant.env.JSPB_TASK_SWEEPER, sweeper, {
    name: "sweeper"
  });
};

export const init = async () => {
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP", "SIGUSR1", "SIGUSR2"] satisfies Deno.Signal[]) {
    Deno.addSignalListener(signal, async () => {
      if (mutable.shutdown) return;
      mutable.shutdown = true;

      log.debug(`Received ${signal}.`);

      const storeDispose = constant.store.dispose
        .entries()
        .toArray()
        .sort(([, [pa]], [, [pb]]) => pb - pa);

      try {
        for (const [key, [, dispose]] of storeDispose) {
          log.debug(`Closing "${key}"...`);

          try {
            // biome-ignore lint/performance/noAwaitInLoops: serialized
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
    await Promise.all([initDatabase()]);
    await Promise.all([initTask(), initHTTPServer(router().fetch)]);
  } catch (error) {
    log.error(error);

    Deno.exitCode = 1;
    Deno.kill(Deno.pid, "SIGTERM");
  }
};
