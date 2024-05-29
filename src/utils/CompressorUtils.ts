import { type InputType, brotliCompress, brotliDecompress } from 'node:zlib';
import { ErrorHandler } from '../classes/ErrorHandler.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';

export class CompressorUtils {
	public static async compress(data: InputType): Promise<Buffer> {
		return new Promise((resolve, reject) => {
			brotliCompress(data, (err, buffer) => {
				if (err) {
					reject(ErrorHandler.send(ErrorCode.documentCorrupted));
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
					reject(ErrorHandler.send(ErrorCode.documentCorrupted));
				} else {
					resolve(buffer);
				}
			});
		});
	}
}
