import { ensureDir } from "@std/fs";

import { Database } from "#db/index.ts";
import { http } from "#http/index.ts";
import { taskRegister } from "#task/index.ts";
import { sweeper } from "#task/list/sweeper.ts";
import { Logger } from "#util/console.ts";
import { env } from "#util/env.ts";

import {
  constantPathStructStorage,
  constantPathStructStorageData,
  constantStoreDispose,
  mutableDatabase,
  mutableHttpServer,
  setMutableDatabase,
  setMutableHttpServer,
  setMutableRootId
} from "./global.ts";

const log: Logger = new Logger();

export const initDirStruct = async (): Promise<void> => {
  await Promise.all([ensureDir(constantPathStructStorage), ensureDir(constantPathStructStorageData)]);
};

export const initHTTPServer = async (handler?: Deno.ServeHandler<Deno.Addr>): Promise<void> => {
  const id = "__httpServer";

  await constantStoreDispose.get(id)?.run();

  setMutableHttpServer(
    http({
      handler: handler
    })
  );

  constantStoreDispose.set(id, {
    priority: 10,
    run: async (): Promise<void> => {
      mutableHttpServer.unref();

      // Deno.serve will deadlock on shutdown under pressure
      await mutableHttpServer.shutdown();
    }
  });
};

export const initDatabase = async (): Promise<void> => {
  const id = "__databaseServer";

  await constantStoreDispose.get(id)?.run();

  setMutableDatabase(new Database());

  constantStoreDispose.set(id, {
    priority: 0,
    run: (): void => {
      mutableDatabase[Symbol.dispose]();
    }
  });

  await mutableDatabase.migration();

  const rootId = mutableDatabase.user.getRoot()?.id;
  if (!rootId) {
    throw new Error('"root" user not found. Database may be corrupted.');
  }

  setMutableRootId(rootId);
};

export const initTask = (): void => {
  taskRegister(env.JSPB_TASK_SWEEPER, sweeper, {
    name: "sweeper"
  });
};

export const initUnhashedTokenCheck = (): void => {
  const userTokens = mutableDatabase.user.getAll(["token"]);

  let userUnhashedToken = false;
  for (const entry of userTokens) {
    // combo separator
    if (!entry.token.includes(" ")) {
      userUnhashedToken = true;
      break;
    }
  }

  if (userUnhashedToken) {
    log.warn(
      "Users with unhashed tokens found!",
      "Those users may lose access in future versions of JSPaste!",
      "See: https://github.com/jspaste/backend/issues/318"
    );
  }
};
