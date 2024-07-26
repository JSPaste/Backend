import { type InputType, brotliCompress, brotliDecompress } from 'node:zlib';
import { errorHandler } from '../server/errorHandler.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';

export const compression = {
	encode: (data: InputType): Promise<Buffer> => {
		return new Promise((resolve, reject) => {
			brotliCompress(data, (err, buffer) => {
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
