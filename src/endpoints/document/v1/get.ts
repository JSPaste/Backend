import { Hono } from "@hono/hono";
import { stream } from "@hono/hono/streaming";
import { describeRoute, resolver, validator } from "@hono/openapi";
import { decodeTime } from "@std/ulid";
import { type } from "arktype";
import { constant, mutable } from "#/global.ts";
import { compression } from "#document/compression.ts";
import { storage } from "#document/storage.ts";
import type { Env } from "#http/type.ts";
import { ErrorCode, error, genericErrorResponse } from "#util/error.ts";
import {
  validatorDocumentDownload,
  validatorDocumentName,
  validatorDocumentPassword
} from "#util/validator/document.ts";
import { validatorHandler } from "#util/validator/handler.ts";

const schemaParam = type({
  name: validatorDocumentName
});

const schemaHeader = type({
  "x-jspaste-password?": validatorDocumentPassword
});

const schemaQuery = type({
  "dl?": validatorDocumentDownload
});

const schemaResponse = resolver(type(type.unknown));

export default new Hono<Env>().get(
  "/:name",
  describeRoute({
    tags: ["DOCUMENT (v1)"],
    summary: "Get document",
    description: `Get the content/metadata of a published document in the instance.

Note: If you only need to query the document metadata, you should use HEAD method instead`,
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
    const {
      name
      // @ts-expect-error upstream
    } = ctx.req.valid("param") as typeof schemaParam.infer;
    const {
      "x-jspaste-password": password
      // @ts-expect-error upstream
    } = ctx.req.valid("header") as typeof schemaHeader.infer;
    const {
      dl
      // @ts-expect-error upstream
    } = ctx.req.valid("query") as typeof schemaQuery.infer;

    const document = mutable.database.document.get("name", name);
    if (!document?.id) {
      return error.throw(ErrorCode.documentNotFound);
    }
    if (document.password) {
      if (!password) {
        return error.throw(ErrorCode.documentPasswordNeeded);
      }

      if (password !== document.password) {
        return error.throw(ErrorCode.documentInvalidPassword);
      }
    }

    ctx.res.headers.set(
      "x-jspaste-created",
      Temporal.Instant.fromEpochMilliseconds(decodeTime(document.id)).toString()
    );

    // https://github.com/honojs/hono/issues/1130
    if (ctx.req.method === "HEAD") {
      return ctx.body(null);
    }

    const fileHandle = await storage.read(document.id);

    let fileContent: ReadableStream<Uint8Array>;
    if (ctx.req.header("accept-encoding")?.includes("deflate")) {
      fileContent = fileHandle.readable;
      ctx.res.headers.set("content-encoding", "deflate");
    } else {
      fileContent = compression.decode(fileHandle.readable);
    }

    if (typeof dl !== "undefined") {
      ctx.res.headers.set("content-disposition", `attachment; filename="jspaste_${name}"`);
    }

    ctx.res.headers.set("content-type", "text/plain");
    ctx.res.headers.set("transfer-encoding", "chunked");

    return stream(ctx, async (stream) => await stream.pipe(fileContent));
  }
);
