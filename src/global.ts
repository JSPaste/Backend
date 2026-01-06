import { STATUS_CODES } from "node:http";
import type { StatementSync } from "node:sqlite";
import type { StatusCode } from "@hono/hono/utils/http-status";
import { LruCache } from "@std/cache";
import env from "arkenv";
import { type } from "arktype";
import { customAlphabet } from "nanoid";
import type { Database } from "#db/database";
import { humanizeSize, humanizeTime } from "#util/humanize.ts";

export const mutable = {
  database: undefined as unknown as Database,
  http: undefined as Deno.HttpServer<Deno.NetAddr> | undefined,
  shutdown: false
};

export const constant = {
  databaseMaxElements: 10_000,
  documentNameLengthDefault: 8,
  documentNameLengthMax: 32,
  documentNameLengthMin: 2,
  documentPasswordLengthMax: 128,
  documentPasswordLengthMin: 2,
  userTokenLength: 59,
  env: env(
    {
      JSPB_LOG_VERBOSITY: type.keywords.number.integer.atLeast(0).atMost(4).default(3),
      JSPB_LOG_TIME: type.boolean.default(true),
      JSPB_HOSTNAME: type.keywords.string.ip.root
        .pipe((hostname) => {
          return {
            isIPv6: hostname.includes(":"),
            root: hostname
          };
        })
        .default("::"),
      JSPB_PORT: type.keywords.number.integer.atLeast(0).atMost(65_535).default(4000),

      // debug
      JSPB_DEBUG_DATABASE_EPHEMERAL: type.boolean.default(false),

      // document
      JSPB_DOCUMENT_SIZE: type.string.pipe(humanizeSize).default("1mb"),
      JSPB_DOCUMENT_AGE: type.string.pipe(humanizeTime).default("0"),
      JSPB_DOCUMENT_ANONYMOUS_AGE: type.string.pipe(humanizeTime).default("7d"),

      // user
      JSPB_USER_REGISTER: type.boolean.default(true),
      JSPB_USER_ROOT_RECOVERY: type.boolean.default(false),

      // task
      JSPB_TASK_SWEEPER: type(
        /^(?:\*|[0-5]?\d(?:-[0-5]?\d)?)(?:\/[1-9]\d*)?(?:,(?:\*|[0-5]?\d(?:-[0-5]?\d)?)(?:\/[1-9]\d*)?)*\s+(?:\*|(?:[01]?\d|2[0-3])(?:-(?:[01]?\d|2[0-3]))?)(?:\/[1-9]\d*)?(?:,(?:\*|(?:[01]?\d|2[0-3])(?:-(?:[01]?\d|2[0-3]))?)(?:\/[1-9]\d*)?)*\s+(?:\*|(?:[1-9]|[12]\d|3[01])(?:-(?:[1-9]|[12]\d|3[01]))?)(?:\/[1-9]\d*)?(?:,(?:\*|(?:[1-9]|[12]\d|3[01])(?:-(?:[1-9]|[12]\d|3[01]))?)(?:\/[1-9]\d*)?)*\s+(?:\*|(?:[1-9]|1[0-2]|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:-(?:[1-9]|1[0-2]|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))?)(?:\/[1-9]\d*)?(?:,(?:\*|(?:[1-9]|1[0-2]|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:-(?:[1-9]|1[0-2]|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))?)(?:\/[1-9]\d*)?)*\s+(?:\*|(?:[0-7]|sun|mon|tue|wed|thu|fri|sat)(?:-(?:[0-7]|sun|mon|tue|wed|thu|fri|sat))?)(?:\/[1-9]\d*)?(?:,(?:\*|(?:[0-7]|sun|mon|tue|wed|thu|fri|sat)(?:-(?:[0-7]|sun|mon|tue|wed|thu|fri|sat))?)(?:\/[1-9]\d*)?)*$/i
      )
        .describe("a valid unix based cron: https://man7.org/linux/man-pages/man5/crontab.5.html")
        .default("0 1 * * *")
    },
    {
      env: Deno.env.toObject()
    }
  ),
  nanoid: customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"),
  path: {
    struct: {
      storage: "./storage/",
      storageData: "./storage/data/"
    },
    databaseFile: "./storage/database.db"
  },
  store: {
    statements: new LruCache<string, StatementSync>(200),
    dispose: new Map<string, [number, () => Promise<void>]>()
  },
  temporal: {
    utc: () => Temporal.Now.zonedDateTimeISO("Etc/UTC"),
    instant: Temporal.Now.instant
  },
  http: STATUS_CODES as Record<StatusCode, string>,
  textEncoder: new TextEncoder(),
  textDecoder: new TextDecoder()
} as const;
