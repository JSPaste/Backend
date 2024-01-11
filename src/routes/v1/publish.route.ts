import { Elysia, t } from 'elysia';
import { createKey, createSecret } from '../../util/createKey';
import { errorSenderPlugin } from '../../plugins/errorSender';
import { DataValidator } from '../../classes/DataValidator';
import { basePath, maxDocLength } from '../../constants/config';
import { DocumentDataStruct } from '../../structures/documentStruct';
import { DocumentManager } from '../../classes/DocumentManager';
import { ErrorSender } from '../../classes/ErrorSender';

export default new Elysia({
	name: 'routes:v1:documents:publish',
})
	.use(errorSenderPlugin)
	.post(
		'',
		async ({ errorSender, request, query, body }) => {
			const buffer = Buffer.from(body as ArrayBuffer);

			if (!DataValidator.isLengthBetweenLimits(buffer, 1, maxDocLength)) {
				return errorSender.sendError(400, {
					type: 'error',
					errorCode: 'jsp.invalid_file_length',
					message:
						'The document data its outside of max length or is null',
				}).response;
			}

			const selectedKey = await createKey();

			const selectedSecret =
				request.headers.get('secret') ?? createSecret();

			console.log(selectedSecret);
			if (!DataValidator.isLengthBetweenLimits(selectedSecret, 1, 200)) {
				return errorSender.sendError(400, {
					type: 'error',
					errorCode: 'jsp.invalid_secret',
					message: 'The provided secret is too big or is null',
				}).response;
			}

			const newDoc: DocumentDataStruct = {
				rawFileData: buffer,
				secret: selectedSecret,
				deletionTime: BigInt(0),
				password: request.headers.get('password') ?? query['password'],
			};

			await DocumentManager.write(basePath + selectedKey, newDoc);

			return { key: selectedKey, secret: selectedSecret };
		},
		{
			type: 'arrayBuffer',
			body: t.Any({ description: 'The file to be uploaded' }),
			response: t.Union([
				t.Object({
					key: t.String({
						description: 'The generated key to access the document',
					}),
					secret: t.String({
						description:
							'The generated secret to delete the document',
					}),
				}),
				ErrorSender.errorType(),
			]),

			detail: { summary: 'Publish document', tags: ['v1'] },
		},
	);
