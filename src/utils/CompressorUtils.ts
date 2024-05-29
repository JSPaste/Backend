import { type InputType, brotliCompress, brotliDecompress } from 'node:zlib';
import { errorHandler } from '../errorHandler.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';

export class CompressorUtils {
	public static async compress(data: InputType): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			brotliCompress(data, (err, buffer) => {
				if (err) {
					reject(errorHandler.send(ErrorCode.documentCorrupted));
				} else {
					resolve(buffer);
				}
			});
		});
	}

	public static async decompress(data: InputType): Promise<Buffer> {
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
}
