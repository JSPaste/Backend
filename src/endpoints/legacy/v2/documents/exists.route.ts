import { Hono } from "@hono/hono/tiny";
import { describeRoute, resolver, validator } from "@hono/openapi";
import { type } from "arktype";
import { constant, mutable } from "#/global.ts";
import type { Env } from "#http/type.ts";
import { genericErrorResponse } from "#util/error.ts";
import { validatorDocumentName } from "#util/validator/document.ts";
import { validatorHandler } from "#util/validator/handler.ts";

const schemaParam = type({
  name: validatorDocumentName
});

const schemaBodyResponse = await resolver(type(type.boolean)).toOpenAPISchema();

export default new Hono<Env>().get(
  "/:name/exists",
  describeRoute({
    deprecated: true,
    tags: ["DOCUMENT (legacy)"],
    summary: "Check document",
    responses: {
      200: {
        content: {
          "text/plain": {
            schema: schemaBodyResponse.schema
          }
        },
        description: constant.http[200]
      },
      400: { ...genericErrorResponse, description: constant.http[400] },
      404: { ...genericErrorResponse, description: constant.http[404] }
    }
  }),
  validator("param", schemaParam, validatorHandler),
  (ctx) => {
    // https://github.com/honojs/hono/issues/1130
    if (ctx.req.method === "HEAD") {
      return ctx.body(null);
    }

    // @ts-expect-error upstream
    const param = ctx.req.valid("param") as typeof schemaParam.infer;

    return ctx.text(mutable.database.document.get("name", param.name)?.name ? "true" : "false");
  }
);
