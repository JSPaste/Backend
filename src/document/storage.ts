import { constant } from "#/global.ts";

export const storage = {
  delete: async (id: string): Promise<void> => {
    try {
      await Deno.remove(constant.path.struct.storageData + id);
    } catch {
      // already deleted (probably)
    }
  },

  read: async (id: string): Promise<Deno.FsFile> => {
    return Deno.open(constant.path.struct.storageData + id);
  },

  write: async (id: string, data: ReadableStream<Uint8Array>): Promise<void> => {
    await using handle = await Deno.open(constant.path.struct.storageData + id, {
      create: true,
      write: true,
      truncate: true
    });

    await data.pipeTo(handle.writable, { preventClose: true });
  },

  // relaxed exists because races between fs/db may ocurr
  list: function* (relaxed?: boolean): Iterable<string> {
    for (const entry of Deno.readDirSync(constant.path.struct.storageData)) {
      if (entry.isFile) {
        if (relaxed) {
          const info = Deno.statSync(constant.path.struct.storageData + entry.name);

          if (
            info.mtime &&
            constant.temporal.utc().epochMilliseconds -
              info.mtime.toTemporalInstant().toZonedDateTimeISO("Etc/UTC").epochMilliseconds <
              10_000
          )
            continue;
        }

        yield entry.name;
      }
    }
  }
} as const;
