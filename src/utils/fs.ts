import type { Context } from "hono";

import type { Document } from "#db/query.ts";
import type { Env } from "#http/handler.ts";

import { constantPathStructStorageData, constantTemporalToUTC, constantTemporalUTC } from "../global.ts";
import { documentVersionV1, documentVersionV2 } from "./document.ts";
import { env } from "./env.ts";
import { errorCodeDocumentCorrupted, errorCodeDocumentInvalidSize, errorThrow } from "./error.ts";

export const fsWrite = async (ctx: Context<Env>, { id }: Pick<Document, "id">): Promise<void> => {
  await using handle = await Deno.open(constantPathStructStorageData + id, {
    create: true,
    write: true,
    truncate: true
  });

  let stream: ReadableStream<Uint8Array>;
  switch (env.JSPB_DOCUMENT_COMPRESSION) {
    case documentVersionV1: {
      // ctx.req.raw.body is only null on GET/HEAD
      stream = (ctx.req.raw.body as NonNullable<typeof ctx.req.raw.body>).pipeThrough(new CompressionStream("deflate"));

      break;
    }
    case documentVersionV2: {
      // ctx.req.raw.body is only null on GET/HEAD
      stream = ctx.req.raw.body as NonNullable<typeof ctx.req.raw.body>;

      break;
    }
    default: {
      return errorThrow(errorCodeDocumentCorrupted);
    }
  }

  try {
    await stream.pipeTo(handle.writable, { preventClose: true });
  } catch (why) {
    void fsDelete({ id: id });

    if (why instanceof Deno.errors.BrokenPipe) {
      return errorThrow(errorCodeDocumentInvalidSize);
    }

    throw why;
  }
};

export const fsDelete = async ({ id }: Pick<Document, "id">): Promise<void> => {
  try {
    await Deno.remove(constantPathStructStorageData + id);
  } catch (why) {
    // already deleted
    if (why instanceof Deno.errors.NotFound) return;

    throw why;
  }
};

export const fsRead = async (
  ctx: Context<Env>,
  { id, version }: Pick<Document, "id" | "version">,
  clientIgnoreCapabilities = false
): Promise<ReadableStream<Uint8Array<ArrayBufferLike>>> => {
  const handle = await Deno.open(constantPathStructStorageData + id);

  const hasClientDeflate = clientIgnoreCapabilities ? false : ctx.req.header("accept-encoding")?.includes("deflate");

  let stream: ReadableStream<Uint8Array>;
  switch (version) {
    case documentVersionV1: {
      if (hasClientDeflate) {
        ctx.res.headers.set("content-encoding", "deflate");
        stream = handle.readable;
      } else {
        stream = handle.readable.pipeThrough(new DecompressionStream("deflate"));
      }

      break;
    }
    case documentVersionV2: {
      stream = handle.readable;

      break;
    }
    default: {
      return errorThrow(errorCodeDocumentCorrupted);
    }
  }

  return stream;
};

// relaxed exists because races between fs/db may occur
export function* fsList(relaxed?: boolean): Iterable<string> {
  for (const entry of Deno.readDirSync(constantPathStructStorageData)) {
    if (entry.isFile) {
      if (relaxed) {
        const info = Deno.statSync(constantPathStructStorageData + entry.name);

        if (
          !info.mtime ||
          constantTemporalUTC().epochMilliseconds -
            constantTemporalToUTC(info.mtime.toTemporalInstant()).epochMilliseconds >=
            10_000
        ) {
          yield entry.name;
        }
      } else {
        yield entry.name;
      }
    }
  }
}
