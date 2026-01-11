import { Hono } from "@hono/hono/tiny";
import { describeRoute, resolver, validator } from "@hono/openapi";
import { type } from "arktype";
import { constant, DocumentVersion, mutable } from "#/global.ts";
import { compression } from "#document/compression.ts";
import { storage } from "#document/storage.ts";
import { authMiddleware } from "#http/middleware/authorization.ts";
import { bodyCheck } from "#http/middleware/bodyCheck.ts";
import { bodySize } from "#http/middleware/bodySize.ts";
import type { Env } from "#http/type.ts";
import { generateHash } from "#util/crypto.ts";
import { isOwner } from "#util/document.ts";
import { ErrorCode, error, genericErrorResponse } from "#util/error.ts";
import {
  validatorDocumentName,
  validatorDocumentPassword,
  validatorDocumentPasswordEmpty
} from "#util/validator/document.ts";
import { validatorHandler } from "#util/validator/handler.ts";

const schemaBody = await resolver(
  type.unknown.configure({
    description: "Document content.",
    examples: ["Hello, World!"]
  })
).toOpenAPISchema();

const schemaParam = type({
  actualName: validatorDocumentName
});

const schemaHeader = type({
  "x-jspaste-name?": validatorDocumentName,
  "x-jspaste-password?": validatorDocumentPassword.or(validatorDocumentPasswordEmpty)
});

export default new Hono<Env>().patch(
  "/:actualName",
  describeRoute({
    tags: ["DOCUMENT (v1)"],
    summary: "Alter document",
    description: `Edit the content/metadata of a published document in the instance

Note: You can't move the ownership of a document, duplicate the document instead

Note: To remove (nullify) a value, send the header with an empty value`,
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
  validator("param", schemaParam, validatorHandler),
  validator("header", schemaHeader, validatorHandler),
  authMiddleware,
  bodySize,
  bodyCheck,
  async (ctx) => {
    let {
      actualName
      // @ts-expect-error upstream
    } = ctx.req.valid("param") as typeof schemaParam.infer;
    const {
      "x-jspaste-password": newPassword,
      "x-jspaste-name": newName
      // @ts-expect-error upstream
    } = ctx.req.valid("header") as typeof schemaHeader.infer;

    const document = mutable.database.document.get("name", actualName);
    if (!document?.id) {
      return error.throw(ErrorCode.documentNotFound);
    }

    const userId = ctx.get("userId");
    const owner = isOwner(userId, document.user_id);
    if (!owner) {
      return error.throw(ErrorCode.userInvalidToken);
    }

    if (newPassword !== undefined) {
      if (newPassword === "") {
        mutable.database.document.update("name", actualName, "password", null);
      } else {
        const hash = generateHash(newPassword);

        mutable.database.document.update("name", actualName, "password", hash.combo);
      }
    }

    // keep newName last thing to alter in case of race conditions
    if (newName) {
      if (mutable.database.document.get("name", newName)?.name) {
        return error.throw(ErrorCode.documentNameAlreadyExists);
      }

      mutable.database.document.update("name", actualName, "name", newName);

      actualName = newName;
    }

    if (ctx.get("hasBody")) {
      mutable.database.document.update("name", actualName, "version", constant.env.JSPB_DOCUMENT_COMPRESSION);

      let contentStream: ReadableStream<Uint8Array>;
      if (constant.env.JSPB_DOCUMENT_COMPRESSION === DocumentVersion.V1) {
        // ctx.req.raw.body is only null on GET/HEAD
        contentStream = compression.encode(ctx.req.raw.body as NonNullable<typeof ctx.req.raw.body>);
      } else {
        // ctx.req.raw.body is only null on GET/HEAD
        contentStream = ctx.req.raw.body as NonNullable<typeof ctx.req.raw.body>;
      }

      await storage.write(document.id, contentStream);
    }

    return ctx.body(null);
  }
);
