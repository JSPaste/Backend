import { createMiddleware } from "@hono/hono/factory";
import { constant } from "#/global.ts";
import { ErrorCode, error } from "#util/error.ts";
import type { Env } from "../type.ts";

export const bodyStream = createMiddleware<Env>(async (ctx, next) => {
  if (!ctx.req.raw.body) {
    ctx.set("hasBody", false);

    return next();
  }

  const contentLengthHeader = ctx.req.raw.headers.get("content-length");
  if (contentLengthHeader !== null && !ctx.req.raw.headers.has("transfer-encoding")) {
    const size = Number.parseInt(contentLengthHeader, 10);
    if (size > constant.env.JSPB_DOCUMENT_SIZE) {
      return error.throw(ErrorCode.documentInvalidSize);
    }

    ctx.set("hasBody", size > 0);

    return next();
  }

  const bodyReader = ctx.req.raw.body.getReader();
  const head = await bodyReader.read();

  bodyReader.releaseLock();

  if (head.done || head.value.length === 0) {
    ctx.set("hasBody", false);

    return next();
  }

  ctx.set("hasBody", true);

  let size = head.value.length;
  const transformer = new TransformStream<Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>>({
    start: (controller) => {
      // reinsert head
      controller.enqueue(head.value);
    },
    transform: (chunk, controller) => {
      size += chunk.length;

      if (size > constant.env.JSPB_DOCUMENT_SIZE) {
        controller.error(new Deno.errors.BrokenPipe());
        return;
      }

      controller.enqueue(chunk);
    }
  });

  const requestInit: RequestInit & { duplex: "half" } = {
    body: ctx.req.raw.body.pipeThrough(transformer),
    duplex: "half"
  };
  ctx.req.raw = new Request(ctx.req.raw, requestInit);

  await next();
});
