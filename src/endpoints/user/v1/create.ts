import { Hono } from "@hono/hono/tiny";
import { describeRoute, resolver } from "@hono/openapi";
import { type } from "arktype";
import { constant, mutable } from "#/global.ts";
import type { Env } from "#http/type.ts";
import { ErrorCode, error, genericErrorResponse } from "#util/error.ts";
import { validatorUserToken } from "#util/validator/user.ts";
import { authMiddleware } from "../../../http/middleware/authorization.ts";

const schemaResponse = resolver(
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
            schema: schemaResponse
          }
        },
        description: constant.http[200]
      },
      400: { ...genericErrorResponse, description: constant.http[400] },
      404: { ...genericErrorResponse, description: constant.http[404] },

      // auth middleware
      401: { ...genericErrorResponse, description: constant.http[401] }
    }
  }),
  authMiddleware,
  async (ctx) => {
    if (!constant.env.JSPB_USER_REGISTER && ctx.get("userId") !== constant.ulid.userRoot) {
      return error.throw(ErrorCode.userInvalidToken);
    }

    return ctx.json({
      token: mutable.database.user.create()
    });
  }
);
