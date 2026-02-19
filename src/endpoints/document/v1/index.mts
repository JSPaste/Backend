import { Hono } from "hono/tiny";
import type { Env } from "#http/handler.mts";
import delete_ from "./delete.mts";
import get from "./get.mts";
import list from "./list.mts";
import patch from "./patch.mts";
import post from "./post.mts";

export const v1DocumentHandler = new Hono<Env>();

v1DocumentHandler.route("/", delete_);
v1DocumentHandler.route("/", get);
v1DocumentHandler.route("/", list);
v1DocumentHandler.route("/", patch);
v1DocumentHandler.route("/", post);
