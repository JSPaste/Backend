import { Hono } from "hono/tiny";

import type { Env } from "#http/handler.ts";

import access from "./access.route.ts";
import accessRaw from "./accessRaw.route.ts";
import edit from "./edit.route.ts";
import exists from "./exists.route.ts";
import publish from "./publish.route.ts";
import remove from "./remove.route.ts";

export const v2LegacyDocumentHandler = new Hono<Env>();

v2LegacyDocumentHandler.route("/", access);
v2LegacyDocumentHandler.route("/", accessRaw);
v2LegacyDocumentHandler.route("/", edit);
v2LegacyDocumentHandler.route("/", exists);
v2LegacyDocumentHandler.route("/", publish);
v2LegacyDocumentHandler.route("/", remove);
