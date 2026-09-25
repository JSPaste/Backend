import { Hono } from "hono/tiny";

import type { Env } from "#http/handler.ts";

import robots from "./robots.txt" with { type: "text" };

export default new Hono<Env>().get("/robots.txt", (ctx) => ctx.text(robots));
