import { Elysia, t } from 'elysia';
import fs from 'node:fs';

import { bundlerModuleNameResolver } from 'typescript';

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

		fs.unlink(basePath + id, (err) => {
			return err ?? { message: 'File deleted successfully' };
		});
	},
	{
		params: t.Object({ id: t.String({ description: 'The document ID', examples: ['abc123'] }) }),
		detail: { summary: 'Remove document by ID', tags: ['v1'] },
	},
);
