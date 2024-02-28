import type { Range } from '../types/Range.ts';
import { Server } from '../classes/Server.ts';

export class StringUtils {
	public static readonly base64URL = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

	public static random(length: number, base: Range<2, 64> = 62): string {
		const baseSet = StringUtils.base64URL.slice(0, base);

		let string = '';

		while (length--) string += baseSet.charAt(Math.floor(Math.random() * baseSet.length));

		return string;
	}

	public static generateKey(length: Range<2, 32> = 8): string {
		return StringUtils.random(length, 64);
	}

	public static async keyExists(key: string): Promise<boolean> {
		return Bun.file(Server.config.documents.documentPath + key).exists();
	}

	public static async createKey(length: number = 8): Promise<string> {
		// FIXME
		const key = StringUtils.generateKey(length as Range<2, 32>);

		return (await StringUtils.keyExists(key)) ? StringUtils.createKey((length + 1) as Range<2, 32>) : key;
	}

	public static createSecret(chunkLength: number = 5, chunks: number = 4): string {
		return Array.from({ length: chunks }, () => StringUtils.random(chunkLength)).join('-');
	}
}
