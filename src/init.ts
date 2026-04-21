import { ensureDir } from "@std/fs";

import { Database } from "#db/index.ts";
import { http } from "#http/index.ts";
import { taskRegister } from "#task/index.ts";
import { sweeper } from "#task/list/sweeper.ts";
import { env } from "#util/env.ts";

import { constantPathStructStorage, constantPathStructStorageData, constantStoreDispose, mutable } from "./global.ts";

export const initDirStruct = async (): Promise<void> => {
  await Promise.all([ensureDir(constantPathStructStorage), ensureDir(constantPathStructStorageData)]);
};

export const initHTTPServer = async (handler?: Deno.ServeHandler<Deno.Addr>): Promise<void> => {
  const id = "__httpServer";

  await constantStoreDispose.get(id)?.run();

  mutable.http = http({
    handler: handler
  });

  constantStoreDispose.set(id, {
    priority: 10,
    run: async (): Promise<void> => {
      mutable.http.unref();

      // Deno.serve will deadlock on shutdown under pressure
      await mutable.http.shutdown();
    }
  });
};

export const initDatabase = async (): Promise<void> => {
  const id = "__databaseServer";

  await constantStoreDispose.get(id)?.run();

  mutable.database = new Database();

  constantStoreDispose.set(id, {
    priority: 0,
    run: (): void => {
      mutable.database[Symbol.dispose]();
    }
  });

  await mutable.database.migration();
};

export const initTask = (): void => {
  taskRegister(env.JSPB_TASK_SWEEPER, sweeper, {
    name: "sweeper"
  });
};
