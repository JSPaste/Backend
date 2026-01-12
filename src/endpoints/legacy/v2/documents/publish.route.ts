import { Hono } from "@hono/hono/tiny";
import { describeRoute, resolver, validator } from "@hono/openapi";
import { monotonicUlid } from "@std/ulid";
import { type } from "arktype";
import { constant, mutable } from "#/global.ts";
import { bodyStream } from "#http/middleware/bodyStream.ts";
import type { Env } from "#http/type.ts";
import { generateHash } from "#util/crypto.ts";
import { generateName } from "#util/document.ts";
import { ErrorCode, error, genericErrorResponse } from "#util/error.ts";
import { fsWrite } from "#util/fs.ts";
import { validatorDocumentName, validatorDocumentPassword } from "#util/validator/document.ts";
import { validatorHandler } from "#util/validator/handler.ts";

const schemaBody = await resolver(
  type.string.configure({
    description: "Data to replace in the document",
    examples: ["Hello world!"]
  })
).toOpenAPISchema();

const schemaHeader = type({
  "password?": validatorDocumentPassword,
  "key?": validatorDocumentName,
  "keylength?": type.number.atLeast(constant.documentNameLengthMin).atMost(constant.documentNameLengthMax).configure({
    description: "The document name length"
  })
});

const schemaBodyResponse = await resolver(
  type({
    key: type.string.configure({
      description: "The document name (formerly key)",
      examples: ["abc123"]
    })
  })
).toOpenAPISchema();

export default new Hono<Env>().post(
  "/",
  describeRoute({
    deprecated: true,
    tags: ["DOCUMENT (legacy)"],
    summary: "Publish document",
    requestBody: {
      content: {
        "text/plain": {
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
      404: { ...genericErrorResponse, description: constant.http[404] }
    }
  }),
  validator("header", schemaHeader, validatorHandler),
  bodyStream,
  async (ctx) => {
    const {
      password,
      key: name,
      keylength: nameLength
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

    const id = monotonicUlid();

    let hashCombo: string | null;
    if (password) {
      hashCombo = generateHash(password).combo;
    } else {
      hashCombo = null;
    }

    mutable.database.document.create({
      id: id,
      user_id: null,
      version: constant.env.JSPB_DOCUMENT_COMPRESSION,
      name: setName,
      password: hashCombo
    });
    await fsWrite(ctx, { id: id });

    return ctx.json({
      key: setName,
      secret: "",
      url: new URL(ctx.req.url).host.concat("/", setName),
      expirationTimestamp: 0
    });
  }
);
