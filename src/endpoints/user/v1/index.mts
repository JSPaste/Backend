import { Hono } from "hono/tiny";
import type { Env } from "#http/handler.mts";
import create from "./create.mts";

export const v1UserHandler = new Hono<Env>();

v1UserHandler.route("/", create);
