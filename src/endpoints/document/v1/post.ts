import { describeRoute, resolver, validator } from "@hono/openapi";
import { monotonicUlid } from "@std/ulid";
import { type } from "arktype";
import { Hono } from "hono/tiny";

import { constantHttpStatusCodes, mutable } from "#/global.ts";
import type { Env } from "#http/handler.ts";
import { authMiddleware } from "#http/middleware/authorization.ts";
import { bodyStream } from "#http/middleware/bodyStream.ts";
import { generateHash } from "#util/crypto.ts";
import { generateName } from "#util/document.ts";
import { env } from "#util/env.ts";
import { ErrorCode, errorThrow, genericErrorResponse } from "#util/error.ts";
import { fsWrite } from "#util/fs.ts";
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
const schemaBodyResponse = resolver(
  type({
    name: validatorDocumentName
  })
);

export default new Hono<Env>().post(
  "/",
  describeRoute({
    tags: ["DOCUMENT (v1)"],
    summary: "Post document",
    description: "Publish a document to the instance",
    security: [{}, { bearer: [] }],
    requestBody: {
      content: {
        "text/plain": schemaBody,
        "application/octet-stream": schemaBody
      }
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: schemaBodyResponse
          }
        },
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
  validator("header", schemaHeader, validatorHandler),
  authMiddleware,
  bodyStream,
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
        return errorThrow(ErrorCode.DocumentNameAlreadyExists);
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
      version: env.JSPB_DOCUMENT_COMPRESSION,
      name: setName,
      password: hashCombo
    });
    await fsWrite(ctx, { id: setId });

    return ctx.json({
      name: setName
    });
  }
);
