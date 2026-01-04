import { createMiddleware } from "@hono/hono/factory";
import { constant } from "#/global.ts";
import { ErrorCode, error } from "#util/error.ts";
import type { Env } from "../type.ts";

// https://github.com/honojs/hono/blob/main/src/middleware/body-limit/index.ts
export const bodySize = createMiddleware<Env>(async (ctx, next) => {
  if (!ctx.req.raw.body) {
    return next();
  }

  const contentLength = ctx.req.raw.headers.get("content-length");
  const transferEncoding = ctx.req.raw.headers.has("transfer-encoding");

  if (contentLength !== null && !transferEncoding) {
    if (Number.parseInt(contentLength, 10) > constant.env.JSPB_DOCUMENT_SIZE) {
      return error.throw(ErrorCode.documentInvalidSize);
    }

    return next();
  }

  let size = 0;
  const stream = ctx.req.raw.body.getReader();
  const reader = new ReadableStream({
    pull: async (controller) => {
      const { done, value } = await stream.read();
      if (done) {
        controller.close();
        return;
      }

      size += value.length;
      if (size > constant.env.JSPB_DOCUMENT_SIZE) {
        stream.cancel();
        controller.error(new Deno.errors.BrokenPipe());
        return;
      }

      controller.enqueue(value);
    },
    cancel: () => {
      stream.cancel();
    }
  });

  const requestInit: RequestInit & { duplex: "half" } = { body: reader, duplex: "half" };
  ctx.req.raw = new Request(ctx.req.raw, requestInit as RequestInit);

  await next();
});
