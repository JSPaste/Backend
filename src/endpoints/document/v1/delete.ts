import { Hono } from "@hono/hono/tiny";
import { describeRoute, validator } from "@hono/openapi";
import { type } from "arktype";
import { constant, mutable } from "#/global.ts";
import { authMiddleware } from "#http/middleware/authorization.ts";
import type { Env } from "#http/type.ts";
import { isOwner } from "#util/document.ts";
import { ErrorCode, error, genericErrorResponse } from "#util/error.ts";
import { fsDelete } from "#util/fs.ts";
import { validatorDocumentName } from "#util/validator/document.ts";
import { validatorHandler } from "#util/validator/handler.ts";

const schemaParam = type({
  name: validatorDocumentName
});

export default new Hono<Env>().delete(
  "/:name",
  describeRoute({
    tags: ["DOCUMENT (v1)"],
    summary: "Delete document",
    description: "Deletes a published document in the instance",
    security: [{}, { bearer: [] }],
    responses: {
      200: {
        description: constant.http[200]
      },
      400: { ...genericErrorResponse, description: constant.http[400] },
      404: { ...genericErrorResponse, description: constant.http[404] },

      // auth middleware
      401: { ...genericErrorResponse, description: constant.http[401] }
    }
  }),
  validator("param", schemaParam, validatorHandler),
  authMiddleware,
  (ctx) => {
    const {
      name
      // @ts-expect-error upstream
    } = ctx.req.valid("param") as typeof schemaParam.infer;

    const document = mutable.database.document.get("name", name);
    if (!document?.id) {
      return error.throw(ErrorCode.documentNotFound);
    }

    const userId = ctx.get("userId");
    const owner = isOwner(userId, document.user_id);
    if (!owner) {
      return error.throw(ErrorCode.userInvalidToken);
    }

    mutable.database.document.delete("name", name);
    void fsDelete(document);

    return ctx.body(null);
  }
);
