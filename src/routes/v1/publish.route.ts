import { Elysia, t } from 'elysia';
import { ErrorSender } from '../../classes/ErrorSender';
import { createKey, createSecret } from '../../util/createKey';
import { errorSenderPlugin } from '../../plugins/errorSender';
import { DocumentDataStruct } from '../../structures/documentStruct';

const basePath = process.env.DOCUMENTS_PATH ?? 'documents';

const maxDocLength = parseInt(process.env.MAX_FILE_LENGHT ?? '0');

export default new Elysia({
	name: 'routes:v1:documents:publish',
})
	.use(errorSenderPlugin)
	.post(
		'',
		async ({ errorSender, request, body }) => {
			const selectedKey = await createKey();

			const buffer = Buffer.from(body);

			if (buffer.length <= 0 || buffer.length >= maxDocLength) {
				return errorSender.sendError(400, {
					type: 'error',
					errorCode: 'jsp.invalid_file_length',
					message:
						'The document data its outside of max length or is null',
				}).response;
			}

			const selectedSecret = createSecret();

			let newDoc: DocumentDataStruct = {
				rawFileData: buffer,
				secret: selectedSecret,
				deletionTime: BigInt(0),
			};

			await Bun.write(
				basePath + selectedKey,
				Bun.deflateSync(DocumentDataStruct.toBinary(newDoc)),
			);

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
