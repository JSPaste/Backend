import { basePath, characters, type Range } from './constants.ts';

export class StringUtils {
	public static random(length: number, base: Range<2, 64> = 62): string {
		const baseSet = characters.slice(0, base);
		let string = '';

		while (length--) string += baseSet.charAt(Math.floor(Math.random() * baseSet.length));

		return string;
	}

	public static async generateKey(length: Range<2, 32> = 8): Promise<string> {
		const key = StringUtils.random(length, 64);

		return (await StringUtils.keyExists(key)) ? StringUtils.generateKey() : key;
	}

	public static async keyExists(key: string): Promise<boolean> {
		return Bun.file(basePath + key).exists();
	}

	public static createSecret(chunkLength: number = 5, chunks: number = 4): string {
		return Array.from({ length: chunks }, () => StringUtils.random(chunkLength)).join('-');
	}
}
