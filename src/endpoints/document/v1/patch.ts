import { describeRoute, resolver, validator } from "@hono/openapi";
import { type } from "arktype";
import { Hono } from "hono/tiny";

import { constantHttpStatusCodes, mutable } from "#/global.ts";
import type { Env } from "#http/handler.ts";
import { authMiddleware } from "#http/middleware/authorization.ts";
import { bodyStream } from "#http/middleware/bodyStream.ts";
import { generateHash } from "#util/crypto.ts";
import { isOwner } from "#util/document.ts";
import { env } from "#util/env.ts";
import { ErrorCode, errorThrow, genericErrorResponse } from "#util/error.ts";
import { fsWrite } from "#util/fs.ts";
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
        "text/plain": schemaBody,
        "application/octet-stream": schemaBody
      }
    },
    responses: {
      200: {
        description: constantHttpStatusCodes[200]
      },
      400: { ...genericErrorResponse, description: constantHttpStatusCodes[400] },
      404: { ...genericErrorResponse, description: constantHttpStatusCodes[404] },

      // auth middleware
      401: { ...genericErrorResponse, description: constantHttpStatusCodes[401] },

      // document name already exists
      409: { ...genericErrorResponse, description: constantHttpStatusCodes[409] },

      // bodyLimit middleware
      413: { ...genericErrorResponse, description: constantHttpStatusCodes[413] }
    }
  }),
  validator("param", schemaParam, validatorHandler),
  validator("header", schemaHeader, validatorHandler),
  authMiddleware,
  bodyStream,
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
      return errorThrow(ErrorCode.DocumentNotFound);
    }

    const userId = ctx.get("userId");
    const owner = isOwner(userId, document.user_id);
    if (!owner) {
      return errorThrow(ErrorCode.UserInvalidToken);
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
        return errorThrow(ErrorCode.DocumentNameAlreadyExists);
      }

      mutable.database.document.update("name", actualName, "name", newName);

      actualName = newName;
    }

    if (ctx.get("hasBody")) {
      mutable.database.document.update("name", actualName, "version", env.JSPB_DOCUMENT_COMPRESSION);
      await fsWrite(ctx, document);
    }

    return ctx.body(null);
  }
);
