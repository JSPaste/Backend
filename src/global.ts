import { STATUS_CODES } from "node:http";

import type { StatusCode } from "hono/utils/http-status";
import { customAlphabet } from "nanoid";

import type { Database } from "#db/index.ts";

export let mutableDatabase: Database;
export const setMutableDatabase = (database: Database) => {
  mutableDatabase = database;
};

export let mutableHttpServer: Deno.HttpServer<Deno.NetAddr>;
export const setMutableHttpServer = (httpServer: Deno.HttpServer<Deno.NetAddr>) => {
  mutableHttpServer = httpServer;
};

export let mutableRootId: string;
export const setMutableRootId = (rootId: string) => {
  mutableRootId = rootId;
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
export const constantStoreDispose = new Map<string, { priority: number; run: () => Promise<void> | void }>();
export const constantTemporalUTC = (): Temporal.ZonedDateTime => Temporal.Now.zonedDateTimeISO("Etc/UTC");
export const constantTemporalToUTC = (temporal: Temporal.Instant): Temporal.ZonedDateTime =>
  temporal.toZonedDateTimeISO("Etc/UTC");
export const constantTemporalInstant = Temporal.Now.instant;
export const constantHttpStatusCodes = STATUS_CODES as Record<StatusCode, string>;
export const constantTextEncoder = new TextEncoder();
export const constantTextDecoder = new TextDecoder();
