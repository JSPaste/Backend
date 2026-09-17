import { Hono } from "hono/tiny";

import type { Env } from "#http/handler.ts";

import robots from "./robots.ts";
import wellKnown from "./wellKnown.ts";

export const metaHandler = new Hono<Env>();

metaHandler.route("/", robots);
metaHandler.route("/", wellKnown);
