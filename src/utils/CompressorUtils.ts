import util from 'node:util';
import zlib from 'node:zlib';

const brotliDecompress = util.promisify(zlib.brotliDecompress);
const brotliCompress = util.promisify(zlib.brotliCompress);

export class CompressorUtils {
	public static async compress(data: Buffer | ArrayBuffer | Uint8Array): Promise<Buffer> {
		return await brotliCompress(data);
	}
	public static async decompress(data: Buffer | ArrayBuffer | Uint8Array): Promise<Buffer> {
		return await brotliDecompress(data);
	}
}
