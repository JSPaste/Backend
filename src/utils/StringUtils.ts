import { Server } from '../classes/Server.ts';
import type { KeyRange, Range } from '../types/Range.ts';

export class StringUtils {
	public static readonly base64URL = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

	public static random(length: number, base: Range<2, 64> = 62): string {
		const baseSet = StringUtils.base64URL.slice(0, base);
		let i = length;
		let string = '';

		while (i--) string += baseSet.charAt(Math.floor(Math.random() * baseSet.length));

		return string;
	}

	public static generateKey(length: KeyRange = Server.config.documents.defaultKeyLength): string {
		return StringUtils.random(length, 64);
	}

	public static async keyExists(key: string): Promise<boolean> {
		return Bun.file(Server.config.documents.documentPath + key).exists();
	}

	public static async createKey(length: KeyRange = Server.config.documents.defaultKeyLength): Promise<string> {
		const key = StringUtils.generateKey(length);

		return (await StringUtils.keyExists(key)) ? StringUtils.createKey((length + 1) as KeyRange) : key;
	}

	public static createSecret(chunkLength = 5, chunks = 4): string {
		return Array.from({ length: chunks }, () => StringUtils.random(chunkLength)).join('-');
	}
}
