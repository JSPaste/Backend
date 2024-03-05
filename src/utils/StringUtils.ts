import { Server } from '../classes/Server.ts';
import type { Range } from '../types/Range.ts';
import { ValidatorUtils } from './ValidatorUtils.ts';

export class StringUtils {
	public static readonly base64URL = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

	public static random(length: number, base: Range<2, 64> = 62): string {
		const baseSet = StringUtils.base64URL.slice(0, base);
		let string = '';

		while (length--) string += baseSet.charAt(Math.floor(Math.random() * baseSet.length));

		return string;
	}

	public static generateKey(length: number): string {
		if (
			ValidatorUtils.isLengthWithinRange(
				length,
				Server.config.documents.minKeyLength,
				Server.config.documents.maxKeyLength
			)
		) {
			length = Server.config.documents.defaultKeyLength;
		}

		return StringUtils.random(length, 64);
	}

	public static async keyExists(key: string): Promise<boolean> {
		return Bun.file(Server.config.documents.documentPath + key).exists();
	}

	public static async createKey(length: number | undefined): Promise<string> {
		if (
			!length ||
			ValidatorUtils.isLengthWithinRange(
				length,
				Server.config.documents.minKeyLength,
				Server.config.documents.maxKeyLength
			)
		) {
			length = Server.config.documents.defaultKeyLength;
		}

		const key = StringUtils.generateKey(length);

		return (await StringUtils.keyExists(key)) ? StringUtils.createKey(length + 1) : key;
	}

	public static createSecret(chunkLength = 5, chunks = 4): string {
		return Array.from({ length: chunks }, () => StringUtils.random(chunkLength)).join('-');
	}
}
