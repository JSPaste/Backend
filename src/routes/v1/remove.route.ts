import { Elysia, t } from 'elysia';
import fs from 'node:fs';

import { bundlerModuleNameResolver, createAbstractBuilder } from 'typescript';

const basePath = process.env.DOCUMENTS_PATH;

export default new Elysia({
	name: 'routes:v1:documents:remove',
}).delete(
	':id',
	async ({ set, params: { id } }) => {
		if (!(await Bun.file(basePath + id).exists())) {
			set.status = 500;

			return {
				error: 'The file does not exists',
			};
		}

		try {
			fs.unlinkSync(basePath + id);

			return { message: 'File deleted successfully' };
		} catch (e) {
			return e;
		}
	},
	{
		params: t.Object({
			id: t.String({
				description: 'The document ID',
				examples: ['abc123'],
			}),
		}),
		detail: { summary: 'Remove document by ID', tags: ['v1'] },
	},
);
