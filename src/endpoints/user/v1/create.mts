import { describeRoute, resolver } from "@hono/openapi";
import { type } from "arktype";
import { Hono } from "hono/tiny";
import { constantHttpStatusCodes, mutable } from "#/global.mts";
import type { Env } from "#http/handler.mts";
import { authMiddleware } from "#http/middleware/authorization.mts";
import { env } from "#util/env.mts";
import { errorCodeUserInvalidToken, errorThrow, genericErrorResponse } from "#util/error.mts";
import { validatorUserToken } from "#util/validator/user.mts";

const schemaBodyResponse = resolver(
  type({
    token: validatorUserToken
  })
);

export default new Hono<Env>().post(
  "/",
  describeRoute({
    tags: ["USER (v1)"],
    summary: "Create user",
    description: "Create a user to the instance",
    security: [{}, { bearer: [] }],
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
    if (!env.JSPB_USER_REGISTER && ctx.get("userId") !== mutable.database.user.getRoot()?.id) {
      return errorThrow(errorCodeUserInvalidToken);
    }

    return ctx.json({
      token: mutable.database.user.create()
    });
  }
);
