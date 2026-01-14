import { Hono } from "@hono/hono/tiny";
import { describeRoute, resolver, validator } from "@hono/openapi";
import { type } from "arktype";
import { constantHttpStatusCodes, mutable } from "#/global.ts";
import type { Env } from "#http/handler.ts";
import { errorCodeDocumentNotFound, errorThrow, genericErrorResponse } from "#util/error.ts";
import { fsDelete } from "#util/fs.ts";
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
        description: constantHttpStatusCodes[200]
      },
      400: { ...genericErrorResponse, description: constantHttpStatusCodes[400] },
      404: { ...genericErrorResponse, description: constantHttpStatusCodes[404] }
    }
  }),
  validator("param", schemaParam, validatorHandler),
  (ctx) => {
    // @ts-expect-error upstream
    const param = ctx.req.valid("param") as typeof schemaParam.infer;

    const document = mutable.database.document.get("name", param.name);
    if (!document?.id || document.user_id) {
      return errorThrow(errorCodeDocumentNotFound);
    }

    mutable.database.document.delete("name", param.name);
    void fsDelete(document);

    return ctx.json({ removed: true });
  }
);
