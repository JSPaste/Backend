import { describeRoute, resolver, validator } from "@hono/openapi";
import { toText } from "@std/streams";
import { type } from "arktype";
import { Hono } from "hono/tiny";

import { constantHttpStatusCodes, mutable } from "#/global.ts";
import type { Env } from "#http/handler.ts";
import { verifyHash } from "#util/crypto.ts";
import { ErrorCode, errorThrow, genericErrorResponse } from "#util/error.ts";
import { fsRead } from "#util/fs.ts";
import { validatorDocumentName, validatorDocumentPassword } from "#util/validator/document.ts";
import { validatorHandler } from "#util/validator/handler.ts";

const schemaParam = type({
  name: validatorDocumentName
});

const schemaHeader = type({
  "password?": validatorDocumentPassword
});

const schemaBodyResponse = await resolver(
  type({
    key: type.string.configure({
      description: "The document name (formerly key)",
      examples: ["abc123"]
    }),
    data: type.string.configure({
      description: "The document data",
      examples: ["Hello, World!"]
    }),
    url: type.string.configure({
      deprecated: true,
      description: "The document URL",
      examples: ["https://jspaste.eu/abc123"]
    }),
    expirationTimestamp: type.number.configure({
      deprecated: true,
      description: "The document expiration timestamp (always will be 0)",
      examples: [0]
    })
  })
).toOpenAPISchema();

export default new Hono<Env>().get(
  "/:name",
  describeRoute({
    deprecated: true,
    tags: ["DOCUMENT (legacy)"],
    summary: "Get document",
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
  validator("header", schemaHeader, validatorHandler),
  async (ctx) => {
    // https://github.com/honojs/hono/issues/1130
    if (ctx.req.method === "HEAD") {
      return ctx.body(null);
    }

    // @ts-expect-error upstream
    const param = ctx.req.valid("param") as typeof schemaParam.infer;
    // @ts-expect-error upstream
    const header = ctx.req.valid("header") as typeof schemaHeader.infer;

    const document = mutable.database.document.get("name", param.name);
    if (!document?.id) {
      return errorThrow(ErrorCode.DocumentNotFound);
    }
    if (document.password) {
      if (!header.password) {
        return errorThrow(ErrorCode.DocumentPasswordNeeded);
      }

      if (!verifyHash(header.password, document.password)) {
        return errorThrow(ErrorCode.DocumentInvalidPassword);
      }
    }

    return ctx.json({
      key: param.name,
      data: await toText(await fsRead(ctx, document, true)),
      url: new URL(ctx.req.url).host.concat("/", param.name),
      expirationTimestamp: 0
    });
  }
);
