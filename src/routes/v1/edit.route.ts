import { Elysia, t } from 'elysia';
import { errorSenderPlugin } from '../../plugins/errorSender';
import { DataValidator } from '../../classes/DataValidator';
import { ErrorSender } from '../../classes/ErrorSender';
import { basePath, maxDocLength } from '../../constants/config';
import { DocumentManager } from '../../classes/DocumentManager';

export default new Elysia({
	name: 'routes:v1:documents:remove',
})
	.use(errorSenderPlugin)
	.put(
		':id',
		async ({ errorSender, request, query, body, params: { id } }) => {
			if (!DataValidator.isAlphanumeric(id))
				return errorSender.sendError(400, {
					type: 'error',
					errorCode: 'jsp.invalid_input',
					message: 'Invalid ID provided',
				}).response;

			const file = Bun.file(basePath + id);

			const fileExists = await file.exists();

			if (!fileExists) {
				return errorSender.sendError(400, {
					type: 'error',
					errorCode: 'jsp.file_not_found',
					message: 'The requested file does not exist',
				}).response;
			}

			const buffer = Buffer.from(body as ArrayBuffer);

			if (!DataValidator.isLengthBetweenLimits(buffer, 1, maxDocLength)) {
				return errorSender.sendError(400, {
					type: 'error',
					errorCode: 'jsp.invalid_file_length',
					message:
						'The document data its outside of max length or is null',
				}).response;
			}

			const doc = await DocumentManager.read(file);

			if (doc.secret != request.headers.get('secret')) {
				return errorSender.sendError(401, {
					type: 'error',
					errorCode: 'jsp.invalid_secret',
					message: 'The secret is not correct',
				}).response;
			}

			doc.rawFileData = buffer;

			await DocumentManager.write(basePath + id, doc);

			return { message: 'File updated successfully' };
		},
		{
			type: 'arrayBuffer',
			body: t.Any({ description: 'The file to be updated' }),

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
