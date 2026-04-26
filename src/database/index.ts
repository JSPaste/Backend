import { DatabaseSync, type StatementSync } from "node:sqlite";

import { LruCache } from "@std/cache";
import { monotonicUlid, ulid } from "@std/ulid";

import { constantPathDatabaseFile } from "#/global.ts";
import { migrations } from "#db/migration.ts";
import { DocumentQuery, UserQuery } from "#db/query.ts";
import { Logger } from "#util/console.ts";
import { generateHash } from "#util/crypto.ts";
import { env } from "#util/env.ts";
import { generateToken } from "#util/user.ts";

const log: Logger = new Logger("database");

type Options = {
  ephemeral?: boolean;
};

export class Database {
  public readonly document = new DocumentQuery(this);
  public readonly user = new UserQuery(this);

  private readonly database: DatabaseSync;
  private readonly store = new LruCache<string, StatementSync>(200);

  public constructor(options: Options = {}) {
    options.ephemeral ??= env.JSPB_DEBUG_DATABASE_EPHEMERAL;

    this.database = new DatabaseSync(options.ephemeral ? ":memory:" : constantPathDatabaseFile);

    if (options.ephemeral) {
      log.warn("Using ephemeral. No changes will persist.");
      return;
    }

    this.exec(`PRAGMA journal_mode = WAL;
               PRAGMA wal_autocheckpoint = 1024;`);
  }

  public async migration(): Promise<void> {
    const query = this.prepare("PRAGMA user_version;", false).get();
    if (typeof query?.user_version !== "number") {
      throw new Deno.errors.InvalidData("Failed to get version.");
    }

    if (query.user_version === migrations.length) {
      log.debug("Already up to date.");
    } else {
      if (query.user_version > migrations.length) {
        throw new Deno.errors.InvalidData("Version is higher than available migrations. Update your JSPaste instance.");
      }

      for (const [delta, migration] of migrations.slice(query.user_version).entries()) {
        try {
          await this.transaction(async () => {
            await migration.preMigration?.(this);
            this.exec(migration.sql);
            await migration.postMigration?.(this);
            this.exec(`PRAGMA user_version = ${(query.user_version as number) + delta + 1};`);
          });
        } catch (error) {
          log.error(`Error while running migration "${migration.id}"..:`);
          throw error;
        }

        log.info(`Migration "${migration.id}" ran successfully.`);
      }
    }

    try {
      const rootId = this.user.getRoot()?.id;

      if (env.JSPB_USER_ROOT_RECOVERY && rootId) {
        const token = generateToken(rootId);
        const hash = generateHash(token);

        this.user.update("id", rootId, "token", hash.combo);

        log.warn("+-- The root user token was regenerated.", "|", `+--> "${token}"`);
      } else if (!rootId?.startsWith("0000000001")) {
        const token = this.user.create(ulid(1));

        log.warn("+-- Note the root user token as it won't be shown again.", "|", `+--> "${token}"`);
      }
    } catch (error) {
      log.error("Failed to handle the root user..:");
      throw error;
    }
  }

  public exec(sql: string): void {
    this.database.exec(sql);
  }

  public prepare(sql: string, cache = true): StatementSync {
    if (!cache) {
      return this.database.prepare(sql);
    }

    let statement = this.store.get(sql);
    if (!statement) {
      statement = this.database.prepare(sql);
      this.store.set(sql, statement);
    }

    return statement;
  }

  public transaction<T>(callback: () => T): T {
    if (this.database.isTransaction) {
      const name = `_${monotonicUlid()}`;

      this.exec(`SAVEPOINT ${name};`);
      try {
        return callback();
      } catch (error) {
        this.exec(`ROLLBACK TO ${name};`);

        throw error;
      } finally {
        this.exec(`RELEASE ${name};`);
      }
    }

    this.exec("BEGIN IMMEDIATE;");
    try {
      const result = callback();

      this.exec("COMMIT;");

      return result;
    } catch (error) {
      this.exec("ROLLBACK;");

      throw error;
    }
  }

  public [Symbol.dispose](): void {
    this.database.close();
  }
}
