import { Hono } from "@hono/hono/tiny";
import { describeRoute, resolver } from "@hono/openapi";
import { decodeTime } from "@std/ulid";
import { constant, mutable } from "#/global.ts";
import { authMiddleware } from "#http/middleware/authorization.ts";
import type { Env } from "#http/type.ts";
import { ErrorCode, error, genericErrorResponse } from "#util/error.ts";
import { validatorDocumentListObject } from "#util/validator/document.ts";

const schemaBodyResponse = await resolver(validatorDocumentListObject.array()).toOpenAPISchema();

export default new Hono<Env>().get(
  "/",
  describeRoute({
    tags: ["DOCUMENT (v1)"],
    summary: "List documents",
    description: "List all user documents in the instance",
    security: [{ bearer: [] }],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: schemaBodyResponse.schema
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
    const userId = ctx.get("userId");
    if (!userId) {
      return error.throw(ErrorCode.userInvalidToken);
    }

    // https://github.com/honojs/hono/issues/1130
    if (ctx.req.method === "HEAD") {
      return ctx.body(null);
    }

    const documents = mutable.database.user.getDocuments(userId).map((document) => {
      return {
        name: document.name,
        created: Temporal.Instant.fromEpochMilliseconds(decodeTime(document.id)).toString()
      };
    });

    return ctx.json(documents);
  }
);
