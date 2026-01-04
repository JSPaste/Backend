type Migration = {
  id: string;
  sql: string;
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
    sql: (await import("./migrations/0001.base.sql", { with: { type: "text" } })).default
  }
] as const;
