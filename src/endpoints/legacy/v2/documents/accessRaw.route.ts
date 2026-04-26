import { describeRoute, resolver, validator } from "@hono/openapi";
import { type } from "arktype";
import { stream } from "hono/streaming";
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

const schemaQuery = type({
  "p?": validatorDocumentPassword
});

const schemaBodyResponse = await resolver(type.unknown).toOpenAPISchema();

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
            schema: schemaBodyResponse.schema
          },
          "application/octet-stream": {
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
  validator("query", schemaQuery, validatorHandler),
  (ctx) => {
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
      return errorThrow(ErrorCode.DocumentNotFound);
    }
    if (document.password) {
      if (!options.password) {
        return errorThrow(ErrorCode.DocumentPasswordNeeded);
      }

      if (!verifyHash(options.password, document.password)) {
        return errorThrow(ErrorCode.DocumentInvalidPassword);
      }
    }

    ctx.res.headers.set("content-type", "text/plain");
    ctx.res.headers.set("transfer-encoding", "chunked");

    return stream(ctx, async (stream) => await stream.pipe(await fsRead(ctx, document, true)));
  }
);
