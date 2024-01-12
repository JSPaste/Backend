import { Elysia, t } from 'elysia';
import { ErrorSender } from '../../classes/ErrorSender';
import { errorSenderPlugin } from '../../plugins/errorSender';
import { DataValidator } from '../../classes/DataValidator';
import { DocumentManager } from '../../classes/DocumentManager';
import { basePath } from '../../utils/constants.ts';

export default new Elysia({
	name: 'routes:v1:documents:access',
})
	.use(errorSenderPlugin)
	.get(
		':id',
		async ({ set, errorSender, request, query, params: { id } }) =>
			await HandleReq(set, errorSender, request, query, id, false),
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
		async ({ set, errorSender, request, query, params: { id } }) => {
			return await HandleReq(set, errorSender, request, query, id, true);
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

async function HandleReq(
	set: any,
	errorSender: any,
	request: any,
	query: any,
	id: string,
	raw: boolean,
): Promise<any> {
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

	// FIXME: Proper error handling

	const doc = await DocumentManager.read(file);

	if (
		doc.password != (request.headers.get('password') ?? query['password'])
	) {
		return errorSender.sendError(400, {
			type: 'error',
			errorCode: 'jsp.file_not_found',
			message: 'The requested file does not exist',
		}).response;
	}

	set.headers['Content-Type'] = 'text/html';

	return raw
		? new Response(doc.rawFileData)
		: {
				key: id,
				data: new TextDecoder().decode(doc.rawFileData),
			};
}
