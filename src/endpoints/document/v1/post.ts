import { Hono } from "@hono/hono/tiny";
import { describeRoute, resolver, validator } from "@hono/openapi";
import { monotonicUlid } from "@std/ulid";
import { type } from "arktype";
import { constant, DocumentVersion, mutable } from "#/global.ts";
import { compression } from "#document/compression.ts";
import { storage } from "#document/storage.ts";
import { authMiddleware } from "#http/middleware/authorization.ts";
import { bodySize } from "#http/middleware/bodySize.ts";
import type { Env } from "#http/type.ts";
import { generateHash } from "#util/crypto.ts";
import { generateName } from "#util/document.ts";
import { ErrorCode, error, genericErrorResponse } from "#util/error.ts";
import {
  validatorDocumentName,
  validatorDocumentNameLength,
  validatorDocumentPassword
} from "#util/validator/document.ts";
import { validatorHandler } from "#util/validator/handler.ts";

const schemaBody = await resolver(
  type.unknown.configure({
    description: "Document content.",
    examples: ["Hello, World!"]
  })
).toOpenAPISchema();

const schemaHeader = type({
  "x-jspaste-name-length?": validatorDocumentNameLength,
  "x-jspaste-name?": validatorDocumentName,
  "x-jspaste-password?": validatorDocumentPassword
});

// Object includes not allowed fields
const schemaBodyResponse = await resolver(
  type({
    name: validatorDocumentName
  })
).toOpenAPISchema();

export default new Hono<Env>().post(
  "/",
  describeRoute({
    tags: ["DOCUMENT (v1)"],
    summary: "Post document",
    description: "Publish a document to the instance",
    security: [{}, { bearer: [] }],
    requestBody: {
      content: {
        "text/plain": {
          schema: schemaBody.schema
        },
        "application/octet-stream": {
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
      404: { ...genericErrorResponse, description: constant.http[404] },

      // auth middleware
      401: { ...genericErrorResponse, description: constant.http[401] },

      // document name already exists
      409: { ...genericErrorResponse, description: constant.http[409] },

      // bodyLimit middleware
      413: { ...genericErrorResponse, description: constant.http[413] }
    }
  }),
  validator("header", schemaHeader, validatorHandler),
  authMiddleware,
  bodySize,
  async (ctx) => {
    const {
      "x-jspaste-password": password,
      "x-jspaste-name": name,
      "x-jspaste-name-length": nameLength
      // @ts-expect-error upstream
    } = ctx.req.valid("header") as typeof schemaHeader.infer;

    let setName: string;
    if (name) {
      if (mutable.database.document.get("name", name)?.name) {
        return error.throw(ErrorCode.documentNameAlreadyExists);
      }

      setName = name;
    } else {
      setName = generateName(nameLength);
    }

    const setId = monotonicUlid();

    let hashCombo: string | null;
    if (password) {
      hashCombo = generateHash(password).combo;
    } else {
      hashCombo = null;
    }

    mutable.database.document.create({
      id: setId,
      user_id: ctx.get("userId") ?? null,
      version: constant.env.JSPB_DOCUMENT_COMPRESSION,
      name: setName,
      password: hashCombo
    });

    let contentStream: ReadableStream<Uint8Array>;
    if (constant.env.JSPB_DOCUMENT_COMPRESSION === DocumentVersion.V1) {
      // ctx.req.raw.body is only null on GET/HEAD
      contentStream = compression.encode(ctx.req.raw.body as NonNullable<typeof ctx.req.raw.body>);
    } else {
      // ctx.req.raw.body is only null on GET/HEAD
      contentStream = ctx.req.raw.body as NonNullable<typeof ctx.req.raw.body>;
    }

    await storage.write(setId, contentStream);

    return ctx.json({
      name: setName
    });
  }
);
