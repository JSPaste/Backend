export const basePath = process.env.DOCUMENTS_PATH;

export const characters = 'abcdefghijklmnopqrstuvwxyz1234567890'.split('');

export async function makeId(
	length: number,
	chars = characters,
): Promise<string> {
	let result = randomChars(length);

	return (await Bun.file(basePath + result).exists())
		? makeId(length + 1, chars)
		: result;
}

export async function createKey(length = 0) {
	return await makeId(length <= 0 ? 3 : length);
}

export async function createSecret(chunkLengh = 5) {
	return (
		randomChars(chunkLengh) +
		'-' +
		randomChars(chunkLengh) +
		'-' +
		randomChars(chunkLengh) +
		'-' +
		randomChars(chunkLengh)
	);
}

function randomChars(length: number, chars = characters) {
	let result = '';
	while (length--) result += chars[Math.floor(Math.random() * chars.length)];
	return result;
}
