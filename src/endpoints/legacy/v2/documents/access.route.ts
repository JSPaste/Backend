import { Hono } from "@hono/hono/tiny";
import { describeRoute, resolver, validator } from "@hono/openapi";
import { toText } from "@std/streams";
import { type } from "arktype";
import { constant, DocumentVersion, mutable } from "#/global.ts";
import { compression } from "#document/compression.ts";
import { storage } from "#document/storage.ts";
import type { Env } from "#http/type.ts";
import { verifyHash } from "#util/crypto.ts";
import { ErrorCode, error, genericErrorResponse } from "#util/error.ts";
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
        description: constant.http[200]
      },
      400: { ...genericErrorResponse, description: constant.http[400] },
      404: { ...genericErrorResponse, description: constant.http[404] }
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
      return error.throw(ErrorCode.documentNotFound);
    }
    if (document.password) {
      if (!header.password) {
        return error.throw(ErrorCode.documentPasswordNeeded);
      }

      if (!verifyHash(header.password, document.password)) {
        return error.throw(ErrorCode.documentInvalidPassword);
      }
    }

    await using fileHandle = await storage.read(document.id);

    let fileContent: ReadableStream<Uint8Array>;
    if (document.version === DocumentVersion.V2) {
      fileContent = fileHandle.readable;
    } else {
      fileContent = compression.decode(fileHandle.readable);
    }

    return ctx.json({
      key: param.name,
      data: await toText(fileContent),
      url: new URL(ctx.req.url).host.concat("/", param.name),
      expirationTimestamp: 0
    });
  }
);
