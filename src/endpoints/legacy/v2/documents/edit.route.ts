import { Hono } from "@hono/hono/tiny";
import { describeRoute, resolver, validator } from "@hono/openapi";
import { type } from "arktype";
import { constant, mutable } from "#/global.ts";
import { bodyStream } from "#http/middleware/bodyStream.ts";
import type { Env } from "#http/type.ts";
import { ErrorCode, error, genericErrorResponse } from "#util/error.ts";
import { fsWrite } from "#util/fs.ts";
import { validatorDocumentName } from "#util/validator/document.ts";
import { validatorHandler } from "#util/validator/handler.ts";

const schemaParam = type({
  name: validatorDocumentName
});

const schemaBody = await resolver(
  type.string.configure({
    description: "Data to replace in the document",
    examples: ["Hello world!"]
  })
).toOpenAPISchema();

const schemaBodyResponse = await resolver(
  type({
    edited: type.boolean.configure({
      description: "Confirmation of edition",
      examples: [true]
    })
  })
).toOpenAPISchema();

export default new Hono<Env>().patch(
  "/:name",
  describeRoute({
    deprecated: true,
    tags: ["DOCUMENT (legacy)"],
    summary: "Edit document",
    requestBody: {
      content: {
        "text/plain": {
          schema: schemaBody.schema
        }
      }
    },
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
  bodyStream,
  async (ctx) => {
    // @ts-expect-error upstream
    const param = ctx.req.valid("param") as typeof schemaParam.infer;

    const document = mutable.database.document.get("name", param.name);
    if (!document?.id || document.user_id) {
      return error.throw(ErrorCode.documentNotFound);
    }

    mutable.database.document.update("name", param.name, "version", constant.env.JSPB_DOCUMENT_COMPRESSION);
    await fsWrite(ctx, document);

    return ctx.json({
      edited: true
    });
  }
);
