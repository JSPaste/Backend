import { Hono } from "hono/tiny";
import type { Env } from "#http/handler.mts";
import access from "./access.route.mts";
import accessRaw from "./accessRaw.route.mts";
import edit from "./edit.route.mts";
import exists from "./exists.route.mts";
import publish from "./publish.route.mts";
import remove from "./remove.route.mts";

export const v2LegacyDocumentHandler = new Hono<Env>();

v2LegacyDocumentHandler.route("/", access);
v2LegacyDocumentHandler.route("/", accessRaw);
v2LegacyDocumentHandler.route("/", edit);
v2LegacyDocumentHandler.route("/", exists);
v2LegacyDocumentHandler.route("/", publish);
v2LegacyDocumentHandler.route("/", remove);
