import { describeRoute, validator } from "@hono/openapi";
import { type } from "arktype";
import type { Context } from "hono";
import { Hono } from "hono/tiny";

import { mutableDatabase } from "#/global.ts";
import { v1DocumentHandler } from "#endpoint/document/v1/index.ts";
import type { Env } from "#http/handler.ts";
import { bodyStream } from "#http/middleware/bodyStream.ts";
import {
  validatorDocumentName,
  validatorDocumentNameLength,
  validatorDocumentPassword
} from "#util/validator/document.ts";
import { validatorHandler } from "#util/validator/handler.ts";

const schemaParam = type({
  name: validatorDocumentName
});

const schemaHeader = type({
  "key?": validatorDocumentName,
  "keylength?": validatorDocumentNameLength,
  "password?": validatorDocumentPassword
});

const schemaPasswordHeader = type({
  "password?": validatorDocumentPassword
});

const schemaQuery = type({
  "p?": validatorDocumentPassword
});

const legacy = (ctx: Context<Env>, path: string, headers: Headers): Request => {
  const requestHeaders = new Headers(ctx.req.raw.headers);
  requestHeaders.delete("authorization");
  requestHeaders.delete("accept-encoding");
  for (const [name, value] of headers) {
    requestHeaders.set(name, value);
  }

  const init: RequestInit & { duplex: "half" } = {
    method: ctx.req.method,
    headers: requestHeaders,
    duplex: "half"
  };

  if (ctx.req.raw.body) {
    init.body = ctx.req.raw.body;
  }

  return new Request(new URL(path, ctx.req.url), init);
};

const toV1 = async (ctx: Context<Env>, path: string, headers: Headers = new Headers()): Promise<Response> => {
  return v1DocumentHandler.fetch(legacy(ctx, path, headers));
};

export default new Hono<Env>()
  // get document
  .get(
    "/:name",
    describeRoute({
      tags: ["DOCUMENT (legacy)"],
      deprecated: true
    }),
    validator("param", schemaParam, validatorHandler),
    validator("header", schemaPasswordHeader, validatorHandler),
    async (ctx) => {
      const { name } = ctx.req.valid("param") as typeof schemaParam.infer;
      const { password } = ctx.req.valid("header") as typeof schemaPasswordHeader.infer;

      const headers = new Headers();

      if (password !== undefined) {
        headers.set("x-jspaste-password", password);
      }

      const response = await toV1(ctx, `/${name}`, headers);
      if (!response.ok) {
        return response;
      }

      return ctx.json({
        data: await response.text(),
        expirationTimestamp: 0,
        key: name,
        url: `${new URL(ctx.req.url).origin}/${name}`
      });
    }
  )

  // edit document
  .patch(
    "/:name",
    describeRoute({
      tags: ["DOCUMENT (legacy)"],
      deprecated: true
    }),
    validator("param", schemaParam, validatorHandler),
    bodyStream,
    async (ctx) => {
      const { name } = ctx.req.valid("param") as typeof schemaParam.infer;

      const response = await toV1(ctx, `/${name}`, new Headers());
      if (!response.ok) {
        return response;
      }

      return ctx.json({ edited: true });
    }
  )

  // remove document
  .delete(
    "/:name",
    describeRoute({
      tags: ["DOCUMENT (legacy)"],
      deprecated: true
    }),
    validator("param", schemaParam, validatorHandler),
    async (ctx) => {
      const { name } = ctx.req.valid("param") as typeof schemaParam.infer;

      const response = await toV1(ctx, `/${name}`, new Headers());
      if (!response.ok) {
        return response;
      }

      return ctx.json({ removed: true });
    }
  )

  // get document data
  .get(
    "/:name/raw",
    describeRoute({
      tags: ["DOCUMENT (legacy)"],
      deprecated: true
    }),
    validator("param", schemaParam, validatorHandler),
    validator("header", schemaPasswordHeader, validatorHandler),
    validator("query", schemaQuery, validatorHandler),
    async (ctx) => {
      const { name } = ctx.req.valid("param") as typeof schemaParam.infer;
      const { password: headerPassword } = ctx.req.valid("header") as typeof schemaPasswordHeader.infer;
      const { p: queryPassword } = ctx.req.valid("query") as typeof schemaQuery.infer;

      const headers = new Headers();

      const password = headerPassword ?? queryPassword;
      if (password !== undefined) {
        headers.set("x-jspaste-password", password);
      }

      return toV1(ctx, `/${name}`, headers);
    }
  )

  // check document
  .get(
    "/:name/exists",
    describeRoute({
      tags: ["DOCUMENT (legacy)"],
      deprecated: true
    }),
    validator("param", schemaParam, validatorHandler),
    (ctx) => {
      const { name } = ctx.req.valid("param") as typeof schemaParam.infer;

      return ctx.text(String(Boolean(mutableDatabase.document.get("name", name)?.id)));
    }
  )

  // publish document
  .post(
    "/",
    describeRoute({
      tags: ["DOCUMENT (legacy)"],
      deprecated: true
    }),
    validator("header", schemaHeader, validatorHandler),
    bodyStream,
    async (ctx) => {
      const { key, keylength, password } = ctx.req.valid("header") as typeof schemaHeader.infer;

      const headers = new Headers();

      if (key !== undefined) {
        headers.set("x-jspaste-name", key);
      }

      if (keylength !== undefined) {
        headers.set("x-jspaste-name-length", String(keylength));
      }

      if (password !== undefined) {
        headers.set("x-jspaste-password", password);
      }

      const response = await toV1(ctx, "/", headers);
      if (!response.ok) {
        return response;
      }

      return ctx.json({ key: (await response.json()).name });
    }
  );
