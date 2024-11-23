import { Hono } from "@hono/hono";
import type { Env } from "#http/type.ts";
import access from "./access.route.ts";
import accessRaw from "./accessRaw.route.ts";
import edit from "./edit.route.ts";
import exists from "./exists.route.ts";
import publish from "./publish.route.ts";
import remove from "./remove.route.ts";

export const v2LegacyDocumentRouter = new Hono<Env>();

v2LegacyDocumentRouter.route("/", access);
v2LegacyDocumentRouter.route("/", accessRaw);
v2LegacyDocumentRouter.route("/", edit);
v2LegacyDocumentRouter.route("/", exists);
v2LegacyDocumentRouter.route("/", publish);
v2LegacyDocumentRouter.route("/", remove);
