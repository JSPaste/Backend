import { Elysia, t } from 'elysia';
import fs from 'node:fs/promises';
import { errorSenderPlugin } from '../../plugins/errorSender';

const basePath = process.env.DOCUMENTS_PATH;

export default new Elysia({
	name: 'routes:v1:documents:remove',
})
	.use(errorSenderPlugin)
	.delete(
		':id',
		async ({ errorSender, params: { id } }) => {
			const file = Bun.file(basePath + id);

			const fileExists = await file.exists();

			if (!fileExists)
				return errorSender.sendError(400, {
					type: 'error',
					errorCode: 'jsp.file_not_found',
					message: 'The requested file does not exist',
				}).response;

			await fs.unlink(basePath + id);

			return { message: 'File deleted successfully' };
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
