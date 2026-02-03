import { Hono } from "hono/tiny";
import type { Env } from "#http/handler.ts";
import create from "./create.ts";

export const v1UserHandler = new Hono<Env>();

v1UserHandler.route("/", create);
