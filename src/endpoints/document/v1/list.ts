import { Hono } from "@hono/hono/tiny";
import { describeRoute, resolver } from "@hono/openapi";
import { decodeTime } from "@std/ulid";
import { constantHttpStatusCodes, mutable } from "#/global.ts";
import type { Env } from "#http/handler.ts";
import { authMiddleware } from "#http/middleware/authorization.ts";
import { errorCodeUserInvalidToken, errorThrow, genericErrorResponse } from "#util/error.ts";
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
        description: constantHttpStatusCodes[200]
      },
      400: { ...genericErrorResponse, description: constantHttpStatusCodes[400] },
      404: { ...genericErrorResponse, description: constantHttpStatusCodes[404] },

      // auth middleware
      401: { ...genericErrorResponse, description: constantHttpStatusCodes[401] }
    }
  }),
  authMiddleware,
  async (ctx) => {
    const userId = ctx.get("userId");
    if (!userId) {
      return errorThrow(errorCodeUserInvalidToken);
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
