import { Hono } from "@hono/hono";
import { stream } from "@hono/hono/streaming";
import { describeRoute, resolver, validator } from "@hono/openapi";
import { type } from "arktype";
import { constant, mutable } from "#/global.ts";
import { compression } from "#document/compression.ts";
import { storage } from "#document/storage.ts";
import type { Env } from "#http/type.ts";
import { ErrorCode, error, genericErrorResponse } from "#util/error.ts";
import { validatorDocumentName, validatorDocumentPassword } from "#util/validator/document.ts";
import { validatorHandler } from "#util/validator/handler.ts";

const schemaParam = type({
  name: validatorDocumentName
});

const schemaHeader = type({
  "password?": validatorDocumentPassword
});

const schemaQuery = type({
  "p?": validatorDocumentPassword
});

const schemaResponse = resolver(type(type.unknown));

export default new Hono<Env>().get(
  "/:name/raw",
  describeRoute({
    deprecated: true,
    tags: ["DOCUMENT (legacy)"],
    summary: "Get document data",
    responses: {
      200: {
        content: {
          "text/plain": {
            schema: schemaResponse
          },
          "application/octet-stream": {
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
  validator("header", schemaHeader, validatorHandler),
  validator("query", schemaQuery, validatorHandler),
  async (ctx) => {
    // https://github.com/honojs/hono/issues/1130
    if (ctx.req.method === "HEAD") {
      return ctx.body(null);
    }

    // @ts-expect-error upstream
    const param = ctx.req.valid("param") as typeof schemaParam.infer;
    // @ts-expect-error upstream
    const header = ctx.req.valid("header") as typeof schemaHeader.infer;
    // @ts-expect-error upstream
    const query = ctx.req.valid("query") as typeof schemaQuery.infer;
    const options = {
      password: header.password || query.p
    };

    const document = mutable.database.document.get("name", param.name);
    if (!document?.id) {
      return error.throw(ErrorCode.documentNotFound);
    }
    if (document.password) {
      if (!options.password) {
        return error.throw(ErrorCode.documentPasswordNeeded);
      }

      if (options.password !== document.password) {
        return error.throw(ErrorCode.documentInvalidPassword);
      }
    }

    const file = await storage.read(document.id);

    let streamData: ReadableStream<Uint8Array>;
    if (ctx.req.header("Accept-Encoding")?.includes("deflate")) {
      streamData = file.readable;
      ctx.res.headers.set("Content-Encoding", "deflate");
    } else {
      streamData = compression.decode(file.readable);
    }

    ctx.res.headers.append("Cache-Control", "no-cache");
    ctx.res.headers.set("Content-Type", "text/plain");
    ctx.res.headers.set("Transfer-Encoding", "chunked");

    return stream(ctx, async (stream) => await stream.pipe(streamData));
  }
);
