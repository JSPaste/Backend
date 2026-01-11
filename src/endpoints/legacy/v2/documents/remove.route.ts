import { Hono } from "@hono/hono/tiny";
import { describeRoute, resolver, validator } from "@hono/openapi";
import { type } from "arktype";
import { constant, mutable } from "#/global.ts";
import { storage } from "#document/storage.ts";
import type { Env } from "#http/type.ts";
import { ErrorCode, error, genericErrorResponse } from "#util/error.ts";
import { validatorDocumentName } from "#util/validator/document.ts";
import { validatorHandler } from "#util/validator/handler.ts";

const schemaParam = type({
  name: validatorDocumentName
});

const schemaBodyResponse = await resolver(
  type({
    removed: type.true.configure({
      description: "Confirmation of deletion",
      examples: [true]
    })
  })
).toOpenAPISchema();

export default new Hono<Env>().delete(
  "/:name",
  describeRoute({
    deprecated: true,
    tags: ["DOCUMENT (legacy)"],
    summary: "Remove document",
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
      404: { ...genericErrorResponse, description: constant.http[404] }
    }
  }),
  validator("param", schemaParam, validatorHandler),
  (ctx) => {
    // @ts-expect-error upstream
    const param = ctx.req.valid("param") as typeof schemaParam.infer;

    const document = mutable.database.document.get("name", param.name);
    if (!document?.id || document.user_id) {
      return error.throw(ErrorCode.documentNotFound);
    }

    mutable.database.document.delete("name", param.name);
    void storage.delete(document.id);

    return ctx.json({ removed: true });
  }
);
