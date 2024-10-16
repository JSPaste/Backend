import { brotliCompressSync, brotliDecompressSync } from 'node:zlib';

export const compression = {
	encode: (data: Buffer): Buffer => {
		return brotliCompressSync(data);
	},

	decode: (data: Buffer): Buffer => {
		return brotliDecompressSync(data);
	}
} as const;
