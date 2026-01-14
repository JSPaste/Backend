import type { Context } from "@hono/hono";
import type { Document } from "#db/query.ts";
import { constant, DocumentVersion } from "../global.ts";
import type { Env } from "../http/type.ts";
import { ErrorCode, error } from "./error.ts";

export const fsWrite = async (ctx: Context<Env>, { id }: Pick<Document, "id">): Promise<void> => {
  await using handle = await Deno.open(constant.path.struct.storageData + id, {
    create: true,
    write: true,
    truncate: true
  });

  let stream: ReadableStream<Uint8Array>;
  switch (constant.env.JSPB_DOCUMENT_COMPRESSION) {
    case DocumentVersion.V1: {
      // ctx.req.raw.body is only null on GET/HEAD
      stream = (ctx.req.raw.body as NonNullable<typeof ctx.req.raw.body>).pipeThrough(new CompressionStream("deflate"));

      break;
    }
    case DocumentVersion.V2: {
      // ctx.req.raw.body is only null on GET/HEAD
      stream = ctx.req.raw.body as NonNullable<typeof ctx.req.raw.body>;

      break;
    }
    default: {
      return error.throw(ErrorCode.documentCorrupted);
    }
  }

  try {
    await stream.pipeTo(handle.writable, { preventClose: true });
  } catch (why) {
    void fsDelete({ id: id });

    if (why instanceof Deno.errors.BrokenPipe) {
      return error.throw(ErrorCode.documentInvalidSize);
    }

    throw why;
  }
};

export const fsDelete = async ({ id }: Pick<Document, "id">): Promise<void> => {
  try {
    await Deno.remove(constant.path.struct.storageData + id);
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
  const handle = await Deno.open(constant.path.struct.storageData + id);

  const hasClientDeflate = clientIgnoreCapabilities ? false : ctx.req.header("accept-encoding")?.includes("deflate");

  let stream: ReadableStream<Uint8Array>;
  switch (version) {
    case DocumentVersion.V1: {
      if (hasClientDeflate) {
        ctx.res.headers.set("content-encoding", "deflate");
        stream = handle.readable;
      } else {
        stream = handle.readable.pipeThrough(new DecompressionStream("deflate"));
      }

      break;
    }
    case DocumentVersion.V2: {
      stream = handle.readable;

      break;
    }
    default: {
      return error.throw(ErrorCode.documentCorrupted);
    }
  }

  return stream;
};

// relaxed exists because races between fs/db may occur
export function* fsList(relaxed?: boolean): Iterable<string> {
  for (const entry of Deno.readDirSync(constant.path.struct.storageData)) {
    if (entry.isFile) {
      if (relaxed) {
        const info = Deno.statSync(constant.path.struct.storageData + entry.name);

        if (
          !info.mtime ||
          constant.temporal.UTC().epochMilliseconds -
            constant.temporal.toUTC(info.mtime.toTemporalInstant()).epochMilliseconds >=
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
