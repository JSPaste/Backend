import fs from 'node:fs/promises';
import { Elysia, t } from 'elysia';
import { errorSenderPlugin } from '../../plugins/errorSender';
import { DataValidator } from '../../classes/DataValidator';
import { ErrorSender } from '../../classes/ErrorSender';
import { DocumentDataStruct } from '../../structures/documentStruct';

const basePath = process.env.DOCUMENTS_PATH;

export default new Elysia({
	name: 'routes:v1:documents:remove',
})
	.use(errorSenderPlugin)
	.delete(
		':id',
		async ({ errorSender, params: { id } }) => {
			if (!DataValidator.isAlphanumeric(id))
				return errorSender.sendError(400, {
					type: 'error',
					errorCode: 'jsp.invalid_input',
					message: 'Invalid ID provided',
				}).response;

			const file = Bun.file(basePath + id);

			const fileExists = await file.exists();

			// FIXME: Require a secret to delete the document

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
			response: t.Union([
				t.Object({
					message: t.String({
						description:
							'A message saying that the deletion was successful',
					}),
				}),
				ErrorSender.errorType(),
			]),
			detail: { summary: 'Remove document by ID', tags: ['v1'] },
		},
	);
