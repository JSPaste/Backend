import { Hono } from "hono/tiny";

import type { Env } from "#http/handler.ts";

import create from "./create.ts";
import drop from "./drop.ts";
import rotateToken from "./rotateToken.ts";

export const v1UserHandler = new Hono<Env>();

v1UserHandler.route("/", create);
v1UserHandler.route("/", drop);
v1UserHandler.route("/", rotateToken);
