import { Hono } from "@hono/hono";
import { describeRoute, resolver, validator } from "@hono/openapi";
import { type } from "arktype";
import { constant, mutable } from "#/global.ts";
import { compression } from "#document/compression.ts";
import { storage } from "#document/storage.ts";
import { bodySize } from "#http/middleware/bodySize.ts";
import type { Env } from "#http/type.ts";
import { ErrorCode, error, genericErrorResponse } from "#util/error.ts";
import { validatorDocumentName } from "#util/validator/document.ts";
import { validatorHandler } from "#util/validator/handler.ts";

const schemaParam = type({
  name: validatorDocumentName
});

const schemaRequest = await resolver(
  type(
    type.string.configure({
      description: "Data to replace in the document",
      examples: ["Hello world!"]
    })
  )
).toOpenAPISchema();

const schemaResponse = resolver(
  type({
    edited: type.boolean.configure({
      description: "Confirmation of edition",
      examples: [true]
    })
  })
);

export default new Hono<Env>().patch(
  "/:name",
  describeRoute({
    deprecated: true,
    tags: ["DOCUMENT (legacy)"],
    summary: "Edit document",
    requestBody: {
      content: {
        "text/plain": schemaRequest
      }
    },
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
      404: { ...genericErrorResponse, description: constant.http[404] }
    }
  }),
  validator("param", schemaParam, validatorHandler),
  bodySize,
  async (ctx) => {
    // @ts-expect-error upstream
    const param = ctx.req.valid("param") as typeof schemaParam.infer;

    const document = mutable.database.document.get("name", param.name);
    if (!document?.id || document.user_id) {
      return error.throw(ErrorCode.documentNotFound);
    }

    await storage.write(
      document.id,
      // ctx.req.raw.body is only null on GET/HEAD
      compression.encode(ctx.req.raw.body as NonNullable<typeof ctx.req.raw.body>)
    );

    return ctx.json({
      edited: true
    });
  }
);
