import { createMiddleware } from "@hono/hono/factory";
import type { Env } from "../type.ts";

export const bodyCheck = createMiddleware<Env>(async (ctx, next) => {
  if (!ctx.req.raw.body) {
    ctx.set("hasBody", false);
    return next();
  }

  const contentLength = ctx.req.raw.headers.get("content-length");
  const transferEncoding = ctx.req.raw.headers.has("transfer-encoding");

  if (contentLength !== null && !transferEncoding) {
    ctx.set("hasBody", Number.parseInt(contentLength, 10) > 0);
    return next();
  }

  const stream = ctx.req.raw.body.getReader();
  const chunk = await stream.read();
  if (chunk.done || chunk.value.length === 0) {
    ctx.set("hasBody", false);
    return next();
  }

  ctx.set("hasBody", true);

  const reader = new ReadableStream({
    start: (controller) => {
      // reinsert the validation chunk
      controller.enqueue(chunk.value);
    },
    pull: async (controller) => {
      const { done, value } = await stream.read();
      if (done) {
        controller.close();
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
