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

	public static generateName(length: number = Server.DOCUMENT_NAME_LENGTH_DEFAULT): string {
		if (
			!ValidatorUtils.isLengthWithinRange(
				length,
				Server.DOCUMENT_NAME_LENGTH_MIN,
				Server.DOCUMENT_NAME_LENGTH_MAX
			)
		) {
			length = Server.DOCUMENT_NAME_LENGTH_DEFAULT;
		}

		return StringUtils.random(length, 64);
	}

	public static async nameExists(name: string): Promise<boolean> {
		return Bun.file(Server.DOCUMENT_PATH + name).exists();
	}

	public static async createName(length: number = Server.DOCUMENT_NAME_LENGTH_DEFAULT): Promise<string> {
		const key = StringUtils.generateName(length);

		return (await StringUtils.nameExists(key)) ? StringUtils.createName(length + 1) : key;
	}

	public static createSecret(chunkLength = 5, chunks = 4): string {
		return Array.from({ length: chunks }, () => StringUtils.random(chunkLength)).join('-');
	}
}
