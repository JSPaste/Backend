import { describeRoute, resolver, validator } from "@hono/openapi";
import { type } from "arktype";
import { Hono } from "hono/tiny";
import { constantHttpStatusCodes, mutable } from "#/global.mts";
import type { Env } from "#http/handler.mts";
import { bodyStream } from "#http/middleware/bodyStream.mts";
import { env } from "#util/env.mts";
import { errorCodeDocumentNotFound, errorThrow, genericErrorResponse } from "#util/error.mts";
import { fsWrite } from "#util/fs.mts";
import { validatorDocumentName } from "#util/validator/document.mts";
import { validatorHandler } from "#util/validator/handler.mts";

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
        description: constantHttpStatusCodes[200]
      },
      400: { ...genericErrorResponse, description: constantHttpStatusCodes[400] },
      404: { ...genericErrorResponse, description: constantHttpStatusCodes[404] }
    }
  }),
  validator("param", schemaParam, validatorHandler),
  bodyStream,
  async (ctx) => {
    // @ts-expect-error upstream
    const param = ctx.req.valid("param") as typeof schemaParam.infer;

    const document = mutable.database.document.get("name", param.name);
    if (!document?.id || document.user_id) {
      return errorThrow(errorCodeDocumentNotFound);
    }

    mutable.database.document.update("name", param.name, "version", env.JSPB_DOCUMENT_COMPRESSION);
    await fsWrite(ctx, document);

    return ctx.json({
      edited: true
    });
  }
);
