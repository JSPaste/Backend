import { DatabaseSync, type StatementSync } from "node:sqlite";
import { monotonicUlid } from "@std/ulid";
import { constant } from "#/global.ts";
import { Logger } from "#util/console.ts";
import { migrations } from "./migrations.ts";
import { DocumentQuery, UserQuery } from "./query.ts";

const log: Logger = new Logger("database");

type Options = {
  ephemeral?: boolean;
};

export class Database {
  public readonly document = new DocumentQuery(this);
  public readonly user = new UserQuery(this);

  private readonly database: DatabaseSync;

  public constructor(options?: Options) {
    const ephemeral = options?.ephemeral ?? constant.env.JSPB_DEBUG_DATABASE_EPHEMERAL;

    this.database = new DatabaseSync(ephemeral ? ":memory:" : constant.path.databaseFile);

    if (ephemeral) {
      log.warn("Using ephemeral. No changes will persist.");
      return;
    }

    this.exec(`PRAGMA journal_mode = WAL;
               PRAGMA wal_autocheckpoint = 1024;`);
  }

  public migration(): void {
    const query = this.prepare("PRAGMA user_version;", false).get();
    if (typeof query?.user_version !== "number") {
      throw new Deno.errors.InvalidData("Failed to get version.");
    }
    if (query.user_version === migrations.length) {
      log.debug("Already up to date.");
      return;
    }
    if (query.user_version > migrations.length) {
      throw new Deno.errors.InvalidData("Version is higher than available migrations. Update your JSPaste instance.");
    }

    migrations.slice(query.user_version).forEach((migration, delta) => {
      try {
        this.transaction(() => {
          this.exec(migration.sql);
          this.exec(`PRAGMA user_version = ${(query.user_version as number) + delta + 1};`);
        });
      } catch (error) {
        log.error(`Error while running migration "${migration.id}"..:`);
        throw error;
      }

      log.info(`Migration "${migration.id}" ran successfully.`);
    });

    if (query.user_version === 0) {
      try {
        const token = this.user.create(constant.ulid.userRoot, constant.env.JSPB_USER_ROOT_TOKEN);

        if (!constant.env.JSPB_USER_ROOT_TOKEN) {
          log.warn("Note the root user token as it won't be shown again", `     >> "${token}" <<`);
        }
      } catch (error) {
        log.error("Failed to create root user..:");
        throw error;
      }
    }
  }

  public exec(sql: string): void {
    this.database.exec(sql);
  }

  public prepare(sql: string, cache = true): StatementSync {
    if (!cache) {
      return this.database.prepare(sql);
    }

    let statement = constant.store.statements.get(sql);
    if (!statement) {
      statement = this.database.prepare(sql);
      constant.store.statements.set(sql, statement);
    }

    return statement;
  }

  public transaction<T>(callback: () => T): T {
    if (this.database.isTransaction) {
      const name = monotonicUlid();

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
    constant.store.statements.clear();
    this.database.close();
  }
}
