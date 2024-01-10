import { Elysia, t } from 'elysia';
import { errorSenderPlugin } from '../../plugins/errorSender';
import { ErrorSender } from '../../classes/ErrorSender';

const basePath = process.env.DOCUMENTS_PATH;

export default new Elysia({
	name: 'routes:v1:documents:access',
})
	.use(errorSenderPlugin)
	.get(
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

			const ab = await file.arrayBuffer();

			const fileData = Bun.inflateSync(Buffer.from(ab));

			return {
				key: id,
				data: new TextDecoder().decode(fileData),
			};
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
					key: t.String({
						description: 'The key of the document',
						examples: ['abc123'],
					}),
					data: t.String({
						description: 'The document',
						examples: ['Hello world'],
					}),
				}),
				ErrorSender.errorType(),
			]),
			detail: { summary: 'Get document by ID', tags: ['v1'] },
		},
	)
	.get(
		':id/raw',
		async ({ errorSender, params: { id } }) => {
			const file = Bun.file(basePath + id);

			const fileExists = await file.exists();

			if (!fileExists)
				return errorSender.sendError(400, {
					type: 'error',
					errorCode: 'jsp.file_not_found',
					message: 'The requested file does not exist',
				});

			const ab = await file.arrayBuffer();

			const fileData = Bun.inflateSync(Buffer.from(ab));

			return fileData;
		},
		{
			params: t.Object(
				{
					id: t.String({
						description: 'The document ID',
						examples: ['abc123'],
					}),
				},
				{
					description: 'The request parameters',
					examples: [{ id: 'abc123' }],
				},
			),
			response: t.Any({
				description: 'The raw document',
				examples: ['Hello world'],
			}),
			detail: {
				summary: 'Get raw document by ID',
				tags: ['v1'],
			},
		},
	);
