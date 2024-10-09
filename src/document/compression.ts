import { constants as zlib, type BrotliOptions, brotliCompressSync, brotliDecompressSync } from 'node:zlib';

const brotliOptions: BrotliOptions = {
	params: {
		[zlib.BROTLI_PARAM_QUALITY]: 4,
		[zlib.BROTLI_PARAM_LGWIN]: 28 // 256mb
	}
};

export const compression = {
	encode: (data: Buffer): Buffer => {
		return brotliCompressSync(data, brotliOptions);
	},

	decode: (data: Buffer): Buffer => {
		return brotliDecompressSync(data, brotliOptions);
	}
} as const;
