import { describeRoute, validator } from "@hono/openapi";
import { type } from "arktype";
import { Hono } from "hono/tiny";
import { constantHttpStatusCodes, mutable } from "#/global.mts";
import type { Env } from "#http/handler.mts";
import { authMiddleware } from "#http/middleware/authorization.mts";
import { isOwner } from "#util/document.mts";
import {
  errorCodeDocumentNotFound,
  errorCodeUserInvalidToken,
  errorThrow,
  genericErrorResponse
} from "#util/error.mts";
import { fsDelete } from "#util/fs.mts";
import { validatorDocumentName } from "#util/validator/document.mts";
import { validatorHandler } from "#util/validator/handler.mts";

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
        description: constantHttpStatusCodes[200]
      },
      400: { ...genericErrorResponse, description: constantHttpStatusCodes[400] },
      404: { ...genericErrorResponse, description: constantHttpStatusCodes[404] },

      // auth middleware
      401: { ...genericErrorResponse, description: constantHttpStatusCodes[401] }
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
      return errorThrow(errorCodeDocumentNotFound);
    }

    const userId = ctx.get("userId");
    const owner = isOwner(userId, document.user_id);
    if (!owner) {
      return errorThrow(errorCodeUserInvalidToken);
    }

    mutable.database.document.delete("name", name);
    void fsDelete(document);

    return ctx.body(null);
  }
);
