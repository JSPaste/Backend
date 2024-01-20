import { Elysia, t } from 'elysia';
import { createKey, createSecret } from '../../utils/createKey';
import { DataValidator } from '../../classes/DataValidator';
import { DocumentDataStruct } from '../../structures/documentStruct';
import { DocumentManager } from '../../classes/DocumentManager';
import { ErrorSender } from '../../classes/ErrorSender';
import { basePath, maxDocLength } from '../../utils/constants.ts';

export default new Elysia({
	name: 'routes:v1:documents:publish'
}).post(
	'',
	async ({ request, query, body }) => {
		const buffer = Buffer.from(body as ArrayBuffer);

		if (!DataValidator.isLengthBetweenLimits(buffer, 1, maxDocLength)) {
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: 'jsp.invalid_file_length',
				message: 'The document data its outside of max length or is null'
			});
		}

		const selectedKey = await createKey();

		// FIXME: v2 spec
		const selectedSecret = request.headers.get('secret') ?? createSecret();

		if (!DataValidator.isLengthBetweenLimits(selectedSecret, 1, 200)) {
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: 'jsp.invalid_secret',
				message: 'The provided secret is too big or is null'
			});
		}

		const newDoc: DocumentDataStruct = {
			rawFileData: buffer,
			secret: selectedSecret,
			deletionTime: BigInt(0),
			password: request.headers.get('password') ?? query['password']
		};

		await DocumentManager.write(basePath + selectedKey, newDoc);

		return { key: selectedKey, secret: selectedSecret };
	},
	{
		type: 'arrayBuffer',
		body: t.Any({ description: 'The file to be uploaded' }),
		response: {
			200: t.Object({
				key: t.String({
					description: 'The generated key to access the document'
				}),
				secret: t.String({
					description: 'The generated secret to delete the document'
				})
			}),
			400: ErrorSender.errorType()
		},
		detail: { summary: 'Publish document', tags: ['v1'] }
	}
);
