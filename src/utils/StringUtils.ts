import { basePath, characters, type NumericRange } from './constants.ts';

export class StringUtils {
	public static random(length: number, base: NumericRange<2, 64> = 62): string {
		const baseSet = characters.slice(0, base);
		let string = '';

		while (length--) string += baseSet.charAt(Math.floor(Math.random() * baseSet.length));
		return string;
	}

	public static async createKey(length: NumericRange<6, 16> = 10): Promise<string> {
		const key = StringUtils.random(length, 64);
		const exists = await Bun.file(basePath + key).exists();

		return exists ? StringUtils.createKey() : key;
	}

	public static createSecret(chunkLength: number = 5, chunks: number = 4): string {
		return Array.from({ length: chunks }, () => StringUtils.random(chunkLength)).join('-');
	}
}
