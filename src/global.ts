import { STATUS_CODES } from "node:http";
import type { StatementSync } from "node:sqlite";
import { LruCache } from "@std/cache";
import type { StatusCode } from "hono/utils/http-status";
import { customAlphabet } from "nanoid";
import type { Database } from "#db/index.ts";

export const mutable = {
  database: undefined as unknown as Database,
  http: undefined as Deno.HttpServer<Deno.NetAddr> | undefined
};

export const constantDatabaseMaxElements = 10_000;
export const constantDocumentNameLengthDefault = 8;
export const constantDocumentNameLengthMax = 32;
export const constantDocumentNameLengthMin = 2;
export const constantDocumentPasswordLengthMax = 128;
export const constantDocumentPasswordLengthMin = 2;
export const constantUserTokenLength = 59;
export const constantNanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_");
export const constantPathStructStorage = "./storage/";
export const constantPathStructStorageData = "./storage/data/";
export const constantPathDatabaseFile = "./storage/database.db";
export const constantStoreStatements = new LruCache<string, StatementSync>(200);
export const constantStoreDispose = new Map<string, [number, () => Promise<void>]>();
export const constantTemporalUTC = () => Temporal.Now.zonedDateTimeISO("Etc/UTC");
export const constantTemporalToUTC = (temporal: Temporal.Instant) => temporal.toZonedDateTimeISO("Etc/UTC");
export const constantTemporalInstant = Temporal.Now.instant;
export const constantHttpStatusCodes = STATUS_CODES as Record<StatusCode, string>;
export const constantTextEncoder = new TextEncoder();
export const constantTextDecoder = new TextDecoder();
