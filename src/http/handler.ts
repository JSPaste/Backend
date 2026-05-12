import { openAPIRouteHandler } from "@hono/openapi";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { Hono } from "hono/tiny";

import { v1DocumentHandler } from "#endpoint/document/v1/index.ts";
import { v1UserHandler } from "#endpoint/user/v1/index.ts";
import { Logger } from "#util/console.ts";
import { env } from "#util/env.ts";
import { ErrorCode, errorGet } from "#util/error.ts";

const log: Logger = new Logger("http");

export type Env = {
  Variables: {
    userId?: string;
    hasBody?: boolean;
  };
};

export const handler = (): Hono<Env> => {
  const handler = new Hono<Env>().basePath("/api");

  handler.notFound((ctx) => {
    return ctx.body(null, 404);
  });

  handler.onError((instance, ctx) => {
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

      return ctx.json(errorGet(ErrorCode.DocumentCorrupted));
    }

    log.error(instance);

    return ctx.json(errorGet(ErrorCode.Crash));
  });

  handler.use("*", cors());
  handler.use(async (ctx, next) => {
    await next();

    // disable compression
    // https://docs.deno.com/runtime/fundamentals/http_server/#automatic-body-compression
    ctx.res.headers.set("Cache-Control", "no-transform");
  });

  handler.get(
    "/oas.json",
    openAPIRouteHandler(handler, {
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
- Instance registration policy: ${env.JSPB_USER_REGISTER ? "OPEN" : "CLOSED"}
- Document size limit: ${env.JSPB_DOCUMENT_SIZE === 0 ? "unlimited" : env.JSPB_DOCUMENT_SIZE}
- Document lifetime: ${env.JSPB_DOCUMENT_AGE.total("minutes") === 0 ? "unlimited" : env.JSPB_DOCUMENT_AGE.total("minutes")}
- Document anonymous lifetime: ${env.JSPB_DOCUMENT_ANONYMOUS_AGE.total("minutes") === 0 ? "unlimited" : env.JSPB_DOCUMENT_ANONYMOUS_AGE.total("minutes")}
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

  handler.route("/document/v1", v1DocumentHandler);
  handler.route("/user/v1", v1UserHandler);

  return handler;
};
