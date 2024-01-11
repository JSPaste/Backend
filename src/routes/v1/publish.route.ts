import { Elysia, t } from 'elysia';
import { createKey, createSecret } from '../../util/createKey';
import { errorSenderPlugin } from '../../plugins/errorSender';
import { DataValidator } from '../../classes/DataValidator';
import { DocumentDataStruct } from '../../structures/documentStruct';
import { WriteDocument } from '../../util/documentWriter';

import { basePath } from '../../index';
import { maxDocLength } from '../../index';

export default new Elysia({
	name: 'routes:v1:documents:publish',
})
	.use(errorSenderPlugin)
	.post(
		'',
		async ({ errorSender, request, query, body }) => {
			const buffer = Buffer.from(body);

			if (buffer.length <= 0 || buffer.length >= maxDocLength) {
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

			if (
				DataValidator.isStringLengthBetweenLimits(
					selectedSecret,
					1,
					200,
				)
			) {
				return errorSender.sendError(400, {
					type: 'error',
					errorCode: 'jsp.invalid_secret',
					message: 'The provided secret is too big or is null',
				}).response;
			}

			let newDoc: DocumentDataStruct = {
				rawFileData: buffer,
				secret: selectedSecret,
				deletionTime: BigInt(0),
				password: request.headers.get('password') ?? query['password'],
			};

			await WriteDocument(basePath + selectedKey, newDoc);

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
			]),
			detail: { summary: 'Publish document', tags: ['v1'] },
		},
	);
