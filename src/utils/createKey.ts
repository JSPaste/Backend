import { basePath } from './constants.ts';

export const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'.split(
	''
);

export async function makeId(length: number, charsArray = characters): Promise<string> {
	let result = randomChars(length);

	const fileExists = await Bun.file(basePath + result).exists();

	return fileExists ? makeId(length + 1, charsArray) : result;
}

export async function createKey(length = 0) {
	return await makeId(length <= 0 ? 3 : length);
}

export function createSecret(chunkLength: number = 5, chunks: number = 4): string {
	return Array.from({ length: chunks }, () => randomChars(chunkLength)).join('-');
}

function randomChars(length: number, chars = characters) {
	let result = '';
	while (length--) result += chars[Math.floor(Math.random() * chars.length)];
	return result;
}
