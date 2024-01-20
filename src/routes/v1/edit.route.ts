import { Elysia, t } from 'elysia';
import { DataValidator } from '../../classes/DataValidator';
import { ErrorSender } from '../../classes/ErrorSender';
import { DocumentManager } from '../../classes/DocumentManager';
import { basePath, maxDocLength } from '../../utils/constants.ts';

export default new Elysia({
	name: 'routes:v1:documents:edit'
}).patch(
	':id',
	async ({ request, body, params: { id } }) => {
		if (!DataValidator.isAlphanumeric(id))
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: 'jsp.invalid_input',
				message: 'Invalid ID provided'
			});

		const file = Bun.file(basePath + id);

		const fileExists = await file.exists();

		if (!fileExists)
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: 'jsp.file_not_found',
				message: 'The requested file does not exist'
			});

		const buffer = Buffer.from(body as ArrayBuffer);

		if (!DataValidator.isLengthBetweenLimits(buffer, 1, maxDocLength)) {
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: 'jsp.invalid_file_length',
				message: 'The document data its outside of max length or is null'
			});
		}

		const doc = await DocumentManager.read(file);

		if (doc.secret != request.headers.get('secret')) {
			return ErrorSender.sendError(403, {
				type: 'error',
				errorCode: 'jsp.invalid_secret',
				message: 'The secret is not correct'
			});
		}

		doc.rawFileData = buffer;

		await DocumentManager.write(basePath + id, doc);

		return { message: 'File updated successfully' };
	},
	{
		type: 'arrayBuffer',
		body: t.Any({ description: 'The new file' }),
		params: t.Object({
			id: t.String({
				description: 'The document ID',
				examples: ['abc123']
			})
		}),
		headers: t.Object({
			secret: t.String({
				description: 'The document secret',
				examples: ['aaaaa-bbbbb-ccccc-ddddd']
			})
		}),
		response: {
			200: t.Object({
				message: t.String({
					description: 'A message saying that the update was successful'
				})
			}),
			400: ErrorSender.errorType(),
			403: ErrorSender.errorType()
		},
		detail: { summary: 'Edit document by ID', tags: ['v1'] }
	}
);
