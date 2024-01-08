import { Elysia, t } from 'elysia';

import zlib from 'zlib';

const basePath = process.env.DOCUMENTS_PATH;

const characters = 'abcdefghijklmnopqrstuvwxyz1234567890'.split('');

async function makeid(length: number, chars = characters): Promise<string> {
	let result = '';
	while (length--) result += chars[Math.floor(Math.random() * chars.length)];
	return (await Bun.file(basePath + result).exists())
		? makeid(length + 1, chars)
		: result;
}
async function createKey(length: number = 0) {
	return await makeid(length <= 0 ? 4 : length);
}

export default new Elysia({
	name: 'routes:v1:documents:publish',
}).post(
	'',
	async ({ set, request, body }) => {
		try {
			const buffer = await request.arrayBuffer();

			const selectedKey = await createKey();

			await Bun.write(basePath + selectedKey, buffer);

			set.status = 200;
		} catch {
			set.status = 500;
		}

		return body;
	},
	{
		body: t.Any(),
	},
);
