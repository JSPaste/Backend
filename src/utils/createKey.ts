import { basePath, type NumericRange } from './constants.ts';
import { randomString } from './randomString.ts';

export async function createKey(length: NumericRange<6, 16> = 10): Promise<string> {
	const key = randomString(length, 64);
	const exists = await Bun.file(basePath + key).exists();

	return exists ? createKey() : key;
}
