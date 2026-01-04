// node:zlib buffers the stream into memory
export const compression = {
  encode: (readable: ReadableStream<Uint8Array<ArrayBuffer>>): ReadableStream<Uint8Array> => {
    return readable.pipeThrough(new CompressionStream("deflate"));
  },

  decode: (readable: ReadableStream<Uint8Array<ArrayBuffer>>): ReadableStream<Uint8Array> => {
    return readable.pipeThrough(new DecompressionStream("deflate"));
  }
} as const;
