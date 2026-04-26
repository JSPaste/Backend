import { describeRoute, resolver } from "@hono/openapi";
import { type } from "arktype";
import { Hono } from "hono/tiny";

import { constantHttpStatusCodes, mutable } from "#/global.ts";
import type { Env } from "#http/handler.ts";
import { authMiddleware } from "#http/middleware/authorization.ts";
import { generateHash } from "#util/crypto.ts";
import { ErrorCode, errorThrow, genericErrorResponse } from "#util/error.ts";
import { generateToken } from "#util/user.ts";
import { validatorUserToken } from "#util/validator/user.ts";

const schemaBodyResponse = resolver(
  type({
    token: validatorUserToken
  })
);

export default new Hono<Env>().post(
  "/token",
  describeRoute({
    tags: ["USER (v1)"],
    summary: "Rotate user token",
    description: "Rotates a user token in the instance",
    security: [{ bearer: [] }],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: schemaBodyResponse
          }
        },
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

    const token = generateToken(userId);
    const hash = generateHash(token);

    mutable.database.user.update("id", userId, "token", hash.combo);

    return ctx.json({
      token: token
    });
  }
);
