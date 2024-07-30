import zlib, { type InputType, brotliCompress, brotliDecompress } from 'node:zlib';
import { errorHandler } from '../server/errorHandler.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';

const compressOptions = {
	params: {
		[zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT, // 0 = generic, 1 = text, 2 = font (WOFF2)
		[zlib.constants.BROTLI_PARAM_QUALITY]: 11,
		[zlib.constants.BROTLI_PARAM_LGWIN]: 28 // 256mb
	}
};

export const compression = {
	encode: (data: InputType): Promise<Buffer> => {
		return new Promise((resolve, reject) => {
			brotliCompress(data, compressOptions, (err, buffer) => {
				if (err) {
					reject(errorHandler.send(ErrorCode.documentCorrupted));
				} else {
					resolve(buffer);
				}
			});
		});
	},

	decode: (data: InputType): Promise<Buffer> => {
		return new Promise((resolve, reject) => {
			brotliDecompress(data, (err, buffer) => {
				if (err) {
					reject(errorHandler.send(ErrorCode.documentCorrupted));
				} else {
					resolve(buffer);
				}
			});
		});
	}
} as const;
