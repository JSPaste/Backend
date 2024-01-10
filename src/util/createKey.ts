export const basePath = process.env.DOCUMENTS_PATH;

export const characters = 'abcdefghijklmnopqrstuvwxyz1234567890'.split('');

export async function makeId(
	length: number,
	chars = characters,
): Promise<string> {
	let result = '';

	while (length--) result += chars[Math.floor(Math.random() * chars.length)];

	return (await Bun.file(basePath + result).exists())
		? makeId(length + 1, chars)
		: result;
}

export async function createKey(length = 0) {
	return await makeId(length <= 0 ? 3 : length);
}
