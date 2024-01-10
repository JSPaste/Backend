export const basePath = process.env.DOCUMENTS_PATH;

export const characters = 'abcdefghijklmnopqrstuvwxyz1234567890'.split('');

export async function makeId(
	length: number,
	charsArray = characters,
): Promise<string> {
	let result = '';

	while (length--)
		result += charsArray[Math.floor(Math.random() * charsArray.length)];

	const fileExists = await Bun.file(basePath + result).exists();

	return fileExists ? makeId(length + 1, charsArray) : result;
}

export async function createKey(length = 0) {
	return await makeId(length <= 0 ? 4 : length);
}
