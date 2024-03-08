import { Server } from '../classes/Server.ts';
import type { Range } from '../types/Range.ts';
import { ValidatorUtils } from './ValidatorUtils.ts';

export class StringUtils {
	public static readonly BASE64URL = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

	public static random(length: number, base: Range<2, 64> = 62): string {
		const baseSet = StringUtils.BASE64URL.slice(0, base);
		let string = '';

		while (length--) string += baseSet.charAt(Math.floor(Math.random() * baseSet.length));

		return string;
	}

	public static generateKey(length: number = Server.DOCUMENT_KEY_LENGTH_DEFAULT): string {
		if (
			!ValidatorUtils.isLengthWithinRange(length, Server.DOCUMENT_KEY_LENGTH_MIN, Server.DOCUMENT_KEY_LENGTH_MAX)
		) {
			length = Server.DOCUMENT_KEY_LENGTH_DEFAULT;
		}

		return StringUtils.random(length, 64);
	}

	public static async keyExists(key: string): Promise<boolean> {
		return Bun.file(Server.DOCUMENT_PATH + key).exists();
	}

	public static async createKey(length: number = Server.DOCUMENT_KEY_LENGTH_DEFAULT): Promise<string> {
		if (
			!ValidatorUtils.isLengthWithinRange(length, Server.DOCUMENT_KEY_LENGTH_MIN, Server.DOCUMENT_KEY_LENGTH_MAX)
		) {
			length = Server.DOCUMENT_KEY_LENGTH_DEFAULT;
		}

		const key = StringUtils.generateKey(length);

		return (await StringUtils.keyExists(key)) ? StringUtils.createKey(length + 1) : key;
	}

	public static createSecret(chunkLength = 5, chunks = 4): string {
		return Array.from({ length: chunks }, () => StringUtils.random(chunkLength)).join('-');
	}
}
