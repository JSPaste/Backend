import { Hono } from "@hono/hono";
import { describeRoute, resolver, validator } from "@hono/openapi";
import { monotonicUlid } from "@std/ulid";
import { type } from "arktype";
import { constant, mutable } from "#/global.ts";
import { DocumentVersion } from "#db/query.ts";
import { compression } from "#document/compression.ts";
import { storage } from "#document/storage.ts";
import { bodySize } from "#http/middleware/bodySize.ts";
import type { Env } from "#http/type.ts";
import { generateName } from "#util/document.ts";
import { ErrorCode, error, genericErrorResponse } from "#util/error.ts";
import { validatorDocumentName, validatorDocumentPassword } from "#util/validator/document.ts";
import { validatorHandler } from "#util/validator/handler.ts";

const schemaHeader = type({
  "password?": validatorDocumentPassword,
  "key?": validatorDocumentName,
  "keylength?": type.number.atLeast(constant.documentNameLengthMin).atMost(constant.documentNameLengthMax).configure({
    description: "The document name length"
  })
});

const schemaBody = await resolver(
  type(
    type.string.configure({
      description: "Data to replace in the document",
      examples: ["Hello world!"]
    })
  )
).toOpenAPISchema();

const schemaResponse = resolver(
  type({
    key: type.string.configure({
      description: "The document name (formerly key)",
      examples: ["abc123"]
    })
  })
);

export default new Hono<Env>().post(
  "/",
  describeRoute({
    deprecated: true,
    tags: ["DOCUMENT (legacy)"],
    summary: "Publish document",
    requestBody: {
      content: {
        "text/plain": schemaBody
      }
    },
    responses: {
      200: {
        content: {
          "application/json": {
            schema: schemaResponse
          }
        },
        description: constant.http[200]
      },
      400: { ...genericErrorResponse, description: constant.http[400] },
      404: { ...genericErrorResponse, description: constant.http[404] }
    }
  }),
  validator("header", schemaHeader, validatorHandler),
  bodySize,
  async (ctx) => {
    const {
      password = null,
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

    await storage.write(
      id,
      // ctx.req.raw.body is only null on GET/HEAD
      compression.encode(ctx.req.raw.body as NonNullable<typeof ctx.req.raw.body>)
    );
    mutable.database.document.create({
      id: id,
      user_id: null,
      version: DocumentVersion.V1,
      name: setName,
      password: password
    });

    return ctx.json({
      key: setName,
      secret: "",
      url: new URL(ctx.req.url).host.concat("/", setName),
      expirationTimestamp: 0
    });
  }
);
