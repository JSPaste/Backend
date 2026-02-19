import { describeRoute, resolver, validator } from "@hono/openapi";
import { type } from "arktype";
import { Hono } from "hono/tiny";
import { constantHttpStatusCodes, mutable } from "#/global.mts";
import type { Env } from "#http/handler.mts";
import { errorCodeDocumentNotFound, errorThrow, genericErrorResponse } from "#util/error.mts";
import { fsDelete } from "#util/fs.mts";
import { validatorDocumentName } from "#util/validator/document.mts";
import { validatorHandler } from "#util/validator/handler.mts";

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
