import { describeRoute } from "@hono/openapi";
import { Hono } from "hono/tiny";

import { constantHttpStatusCodes, mutableDatabase } from "#/global.ts";
import type { Env } from "#http/handler.ts";
import { authMiddleware } from "#http/middleware/authorization.ts";
import { ErrorCode, errorThrow, genericErrorResponse } from "#util/error.ts";

export default new Hono<Env>().delete(
  "/",
  describeRoute({
    tags: ["USER (v1)"],
    summary: "Drop user",
    description: `Deletes a user in the instance

Note: All documents owned by the user will also be deleted`,
    security: [{ bearer: [] }],
    responses: {
      200: {
        description: constantHttpStatusCodes[200]
      },
      400: { ...genericErrorResponse, description: constantHttpStatusCodes[400] },
      404: { ...genericErrorResponse, description: constantHttpStatusCodes[404] },

      // auth middleware
      401: { ...genericErrorResponse, description: constantHttpStatusCodes[401] }
    }
  }),
  authMiddleware,
  (ctx) => {
    const userId = ctx.get("userId");
    if (!userId) {
      return errorThrow(ErrorCode.UserInvalidToken);
    }

    mutableDatabase.user.delete("id", userId);

    return ctx.body(null);
  }
);
