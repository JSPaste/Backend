import { Hono } from "hono/tiny";

import type { Env } from "#http/handler.ts";

import drop from "./drop.ts";
import get from "./get.ts";
import list from "./list.ts";
import patch from "./patch.ts";
import post from "./post.ts";

export const v1DocumentHandler = new Hono<Env>();

v1DocumentHandler.route("/", drop);
v1DocumentHandler.route("/", get);
v1DocumentHandler.route("/", list);
v1DocumentHandler.route("/", patch);
v1DocumentHandler.route("/", post);
