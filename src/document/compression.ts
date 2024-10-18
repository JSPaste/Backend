import { type InputType, brotliCompressSync, brotliDecompressSync } from 'node:zlib';

export const compression = {
	encode: (data: InputType): Buffer => {
		return brotliCompressSync(data);
	},

	decode: (data: InputType): Buffer => {
		return brotliDecompressSync(data);
	}
} as const;
