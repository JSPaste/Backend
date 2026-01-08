import { cors } from "@hono/hono/cors";
import { HTTPException } from "@hono/hono/http-exception";
import { Hono } from "@hono/hono/tiny";
import { openAPIRouteHandler } from "@hono/openapi";
import { v1DocumentRouter } from "#endpoint/document/v1/index.ts";
import { v2LegacyDocumentRouter } from "#endpoint/legacy/v2/documents/index.ts";
import { Logger } from "#util/console.ts";
import { ErrorCode, error } from "#util/error.ts";
import { v1UserRouter } from "../endpoints/user/v1/index.ts";
import { constant } from "../global.ts";
import type { Env } from "./type.ts";

const log: Logger = new Logger("http");

export const router = (): Hono<Env> => {
  const router = new Hono<Env>().basePath("/api");

  router.notFound((ctx) => {
    return ctx.body(null, 404);
  });

  router.onError((instance, ctx) => {
    if (instance instanceof HTTPException) {
      return instance.getResponse();
    }

    // some of them may be triggered by a race condition
    if (
      // IO
      instance instanceof Deno.errors.NotFound ||
      instance instanceof Deno.errors.AlreadyExists ||
      instance instanceof Deno.errors.BadResource ||
      // corrupted stream (probably)
      instance instanceof Deno.errors.Http
    ) {
      log.debug(instance);

      return ctx.json(error.get(ErrorCode.documentCorrupted));
    }

    log.error(instance);

    return ctx.json(error.get(ErrorCode.crash));
  });

  router.use("*", cors());
  router.use(async (ctx, next) => {
    await next();

    // disable compression
    // https://docs.deno.com/runtime/fundamentals/http_server/#automatic-body-compression
    ctx.res.headers.append("Cache-Control", "no-transform");
  });

  router.get(
    "/oas.json",
    openAPIRouteHandler(router, {
      documentation: {
        openapi: "3.1.0",
        info: {
          version: "rolling",
          title: "JSPaste API",
          summary: "Create and share code with JSPaste! The developer website for easy code sharing.",
          description: `The API endpoints documented here are stable. However, the OpenAPI spec used to generate this documentation is unstable. It may change or break without notice.

## User class
- **Anonymous:** Can alter anonymous documents, everyone can alter their documents.
- **Registered:** Can alter their own and anonymous documents, only they and "root" can alter their documents.
- **"root":** Can alter every document, no one can alter their documents except "root" itself.

## Restrictions
Each instance can impose restrictions to the API usage. These restrictions may include, but not limited to:

(the following values might change without notice)
- Instance registration policy: ${constant.env.JSPB_USER_REGISTER ? "OPEN" : "CLOSED"}
- Document size limit: ${constant.env.JSPB_DOCUMENT_SIZE === 0 ? "unlimited" : (constant.env.JSPB_DOCUMENT_SIZE ?? "unknown")}
- Document lifetime: ${constant.env.JSPB_DOCUMENT_AGE.total("minutes") === 0 ? "unlimited" : (constant.env.JSPB_DOCUMENT_AGE.total("minutes") ?? "unknown")}
- Document anonymous lifetime: ${constant.env.JSPB_DOCUMENT_ANONYMOUS_AGE.total("minutes") === 0 ? "unlimited" : (constant.env.JSPB_DOCUMENT_ANONYMOUS_AGE.total("minutes") ?? "unknown")}
`,
          license: {
            name: "EUPL-1.2",
            url: "https://eur-lex.europa.eu/eli/dec_impl/2017/863"
          }
        },
        externalDocs: {
          description: "Source code",
          url: "https://github.com/jspaste/backend"
        },
        components: {
          securitySchemes: {
            bearer: {
              bearerFormat: "base64url",
              type: "http",
              scheme: "bearer",
              description: "Registered user in the instance."
            }
          }
        },
        servers: [
          {
            url: "https://jspaste.eu",
            description: "Official JSPaste instance"
          },
          {
            url: "http://localhost:4000",
            description: "Local instance"
          }
        ]
      }
    })
  );

  // deprecated
  router.get("/documents/*", (ctx) => {
    return ctx.redirect(ctx.req.path.replace(/\/documents\//g, "/v2/documents/"), 307);
  });

  router.route("/document/v1", v1DocumentRouter);
  router.route("/user/v1", v1UserRouter);

  // deprecated
  router.route("/v2/documents", v2LegacyDocumentRouter);

  return router;
};
