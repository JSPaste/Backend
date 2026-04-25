import { describeRoute, resolver, validator } from "@hono/openapi";
import { decodeTime } from "@std/ulid";
import { type } from "arktype";
import { stream } from "hono/streaming";
import { Hono } from "hono/tiny";

import { constantHttpStatusCodes, mutable } from "#/global.ts";
import type { Env } from "#http/handler.ts";
import { verifyHash } from "#util/crypto.ts";
import { ErrorCode, errorThrow, genericErrorResponse } from "#util/error.ts";
import { fsRead } from "#util/fs.ts";
import {
  validatorDocumentName,
  validatorDocumentPassword,
  validatorDocumentPreview
} from "#util/validator/document.ts";
import { validatorHandler } from "#util/validator/handler.ts";
import { validatorCreationTimestamp } from "#util/validator/shared.ts";

const schemaParam = type({
  name: validatorDocumentName
});

const schemaQuery = type({
  "preview?": validatorDocumentPreview
});

const schemaHeader = type({
  "x-jspaste-password?": validatorDocumentPassword
});

const schemaBodyResponse = resolver(type.unknown);

const schemaHeaderResponse = await resolver(
  type({
    "x-jspaste-created": validatorCreationTimestamp
  })
).toOpenAPISchema();

export default new Hono<Env>().get(
  "/:name",
  describeRoute({
    tags: ["DOCUMENT (v1)"],
    summary: "Get document",
    description: `Get the content/metadata of a published document in the instance

Note: If you only need to query the document metadata, you should use HEAD method instead`,
    responses: {
      200: {
        content: {
          "application/octet-stream": {
            schema: schemaBodyResponse
          }
        },
        headers: schemaHeaderResponse.components,
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
    const {
      name
      // @ts-expect-error upstream
    } = ctx.req.valid("param") as typeof schemaParam.infer;
    const {
      "x-jspaste-password": password
      // @ts-expect-error upstream
    } = ctx.req.valid("header") as typeof schemaHeader.infer;
    const {
      preview
      // @ts-expect-error upstream
    } = ctx.req.valid("query") as typeof schemaQuery.infer;

    const document = mutable.database.document.get("name", name);
    if (!document?.id) {
      return errorThrow(ErrorCode.DocumentNotFound);
    }
    if (document.password) {
      if (!password) {
        return errorThrow(ErrorCode.DocumentPasswordNeeded);
      }

      if (!verifyHash(password, document.password)) {
        return errorThrow(ErrorCode.DocumentInvalidPassword);
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

    if (typeof preview === "undefined") {
      ctx.res.headers.set("content-type", "application/octet-stream");
    } else {
      ctx.res.headers.set("content-type", "text/plain");
    }

    ctx.res.headers.set("transfer-encoding", "chunked");

    return stream(ctx, async (stream) => await stream.pipe(await fsRead(ctx, document)));
  }
);
