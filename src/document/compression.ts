import { brotliCompress, brotliDecompress, constants as zlibConstants } from 'node:zlib';
import { errorHandler } from '../server/errorHandler.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';

const compressOptions: { [key: number]: number } = {
	[zlibConstants.BROTLI_PARAM_QUALITY]: 11,
	[zlibConstants.BROTLI_PARAM_LGWIN]: 28 // 256mb
};

export const compression = {
	encode: (data: ArrayBuffer): Promise<Buffer> => {
		return new Promise((resolve, reject) => {
			const isText = Buffer.from(data.slice(0, 1024 * 2)).every(
				(byte) => (byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13
			);

			compressOptions[zlibConstants.BROTLI_PARAM_MODE] = isText
				? zlibConstants.BROTLI_MODE_TEXT
				: zlibConstants.BROTLI_MODE_GENERIC;

			brotliCompress(data, compressOptions, (err, buffer) => {
				if (err) {
					reject(errorHandler.send(ErrorCode.documentCorrupted));
				} else {
					resolve(buffer);
				}
			});
		});
	},

	decode: (data: Uint8Array): Promise<Buffer> => {
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
