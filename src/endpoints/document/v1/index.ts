import { Hono } from "@hono/hono/tiny";
import type { Env } from "#http/type.ts";
import delete_ from "./delete.ts";
import get from "./get.ts";
import patch from "./patch.ts";
import post from "./post.ts";

export const v1DocumentRouter = new Hono<Env>();

v1DocumentRouter.route("/", delete_);
v1DocumentRouter.route("/", get);
v1DocumentRouter.route("/", patch);
v1DocumentRouter.route("/", post);
