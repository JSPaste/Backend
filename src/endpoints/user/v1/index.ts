import { Hono } from "@hono/hono/tiny";
import type { Env } from "#http/type.ts";
import create from "./create.ts";

export const v1UserRouter = new Hono<Env>();

v1UserRouter.route("/", create);
