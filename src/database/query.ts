import type { SQLInputValue } from "node:sqlite";
import { chunk } from "@std/collections";
import { monotonicUlid } from "@std/ulid";
import type { Database } from "#db/index.ts";
import { generateHash } from "#util/crypto.ts";
import { generateToken } from "#util/user.ts";
import { constantDatabaseMaxElements } from "../global.ts";
import type { DocumentVersionType } from "../utils/document.ts";

export type Document = {
  id: string;
  user_id: string | null;
  version: DocumentVersionType;
  name: string;
  password: string | null;
};
export type DocumentIndex = Pick<Document, "id" | "name">;

export type User = {
  id: string;
  token: string;
};
export type UserIndex = Pick<User, "id">;

abstract class Query<Table extends Record<string, SQLInputValue>> {
  protected readonly database: Database;
  private readonly table: string;

  protected constructor(database: Database, table: string) {
    this.database = database;
    this.table = table;
  }

  protected deleteByColumn<K extends keyof Table & string>(column: K, values: Iterable<Table[K]>): void {
    let defaultValues: Iterable<Table[K]>;
    if (typeof values !== "object") {
      defaultValues = [values];
    } else {
      defaultValues = values;
    }

    this.database.transaction(() => {
      for (const batch of chunk(defaultValues, constantDatabaseMaxElements)) {
        this.database
          .prepare(
            `DELETE
             FROM ${this.table}
             WHERE ${column} IN (${batch.map(() => "?").join(", ")})`,
            false
          )
          .run(...batch);
      }
    });
  }

  protected updateByColumn<WK extends keyof Table & string, SK extends keyof Table & string = keyof Table & string>(
    whereColumn: WK,
    whereValue: Table[WK],
    setColumn: SK,
    setValue: Table[SK]
  ): void {
    this.database
      .prepare(`UPDATE ${this.table}
                SET ${setColumn} = :setValue
                WHERE ${whereColumn} = :whereValue`)
      .run({
        setValue: setValue,
        whereValue: whereValue
      });
  }

  protected selectByColumn<K extends keyof Table & string>(column: K, value: Table[K]): Table | undefined {
    return this.database
      .prepare(`SELECT *
                FROM ${this.table}
                WHERE ${column} = :value`)
      .get({
        value: value
      }) as Table | undefined;
  }

  protected selectColumns<K extends keyof Table & string>(columns: K[]): Pick<Table, K>[] {
    return this.database
      .prepare(`SELECT ${columns.join(", ")}
                FROM ${this.table}`)
      .all() as Pick<Table, K>[];
  }
}

export class DocumentQuery extends Query<Document> {
  public constructor(database: Database) {
    super(database, "document");
  }

  public create(params: Document): void {
    this.database
      .prepare(
        `INSERT INTO document (id, user_id, version, name, password)
         VALUES (:id, :user_id, :version, :name, :password)`
      )
      .run({
        id: params.id,
        user_id: params.user_id,
        version: params.version,
        name: params.name,
        password: params.password
      });
  }

  public delete = this.deleteByColumn<keyof DocumentIndex>;
  public update = this.updateByColumn<keyof DocumentIndex>;
  public get = this.selectByColumn<keyof DocumentIndex>;
  public getAll = this.selectColumns;
}

export class UserQuery extends Query<User> {
  public constructor(database: Database) {
    super(database, "user");
  }

  public create(id: string = monotonicUlid()): string {
    const token = generateToken(id);
    const hash = generateHash(token);

    this.database
      .prepare(`INSERT INTO user (id, token)
                VALUES (:id, :token)`)
      .run({ id: id, token: hash.combo });

    return token;
  }

  public delete = this.deleteByColumn<keyof UserIndex>;
  public update = this.updateByColumn<keyof UserIndex>;
  public get = this.selectByColumn<keyof UserIndex>;

  public getRoot(): User | undefined {
    return this.database
      .prepare(`SELECT *
                FROM user
                WHERE user.id
                LIKE '0000000001%'
                LIMIT 1`)
      .get() as User | undefined;
  }

  public getDocuments(id: string): Pick<Document, "id" | "name">[] {
    return this.database
      .prepare(`SELECT document.id, document.name
                FROM document WHERE document.user_id = :id`)
      .all({ id: id }) as Pick<Document, "id" | "name">[];
  }

  public getAll = this.selectColumns;

  public getAllWithoutDocuments(): Pick<User, "id">[] {
    return this.database
      .prepare(`SELECT user.id
                FROM user
                WHERE NOT EXISTS (SELECT 1
                  FROM document
                  WHERE document.user_id = user.id
                )`)
      .all() as Pick<User, "id">[];
  }
}
