import { mapNotNullish } from "@std/collections";
import { ulid } from "@std/ulid";
import { Logger } from "#util/console.ts";
import { generateHash } from "#util/crypto.ts";
import { mutable } from "../global.ts";
import type { Database } from "./database.ts";

const log: Logger = new Logger("database::migration");

type Migration = {
  id: string;
  preMigration?: (database: Database) => Promise<void> | void;
  sql: string;
  postMigration?: (database: Database) => Promise<void> | void;
};

export const migrations: Migration[] = [
  /**
   * @description
   * Base schema.
   *
   * @date 2025-12-27
   */
  {
    id: "0001.base",
    sql: (await import("./migrations/0001.sql", { with: { type: "text" } })).default
  },

  /**
   * @description
   * Hash everything, all future sensitive columns are now hashed.
   * This first stage hashes all documents passwords and moves the root user to a compatible id.
   *
   * @date 2026-01-06
   */
  {
    id: "0002.hashingStage1",
    preMigration: async (database: Database) => {
      // migrate document passwords
      const documentsHashed = mapNotNullish(database.document.getAll(["id", "password"]), ({ id, password }) => {
        if (!password) return;

        const hash = await generateHash(password);
        database.document.update("id", id, "password", hash.combo);
      });

      if (documentsHashed.length > 0) {
        log.debug(`Hashed ${documentsHashed.length} document passwords.`);
      }

      // migrate user root id
      const userRootIdOld = "0000000000FFFF000000000000";
      const userRootToken = database.user.get("id", userRootIdOld)?.token;
      if (userRootToken) {
        const id = ulid(1);
        await database.user.create(id);

        for (const document of database.user.getDocuments(userRootIdOld)) {
          database.document.update("id", document.id, "user_id", id);
        }

        database.user.delete("id", userRootIdOld);

        const userRootId = mutable.database.user.getRoot()?.id;
        if (userRootId) {
          database.user.update("id", userRootId, "token", userRootToken);
        }
      }

      const userTokens = database.user.getAll(["token"]);

      let userTokenUnhashed = false;
      for (const entry of userTokens) {
        // combo separator
        if (!entry.token.includes(" ")) {
          userTokenUnhashed = true;
          break;
        }
      }

      if (userTokenUnhashed) {
        log.warn(
          "Users with plain tokens found!",
          "New users in the instance will have their token hashed,",
          "In the future we will enforce that every user token is hashed."
        );
      }
    },
    sql: (await import("./migrations/0002.sql", { with: { type: "text" } })).default
  }
] as const;
