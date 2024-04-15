import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';
import { Server } from '../classes/Server.ts';
import { CryptoUtils } from '../utils/CryptoUtils.ts';
import { DocumentUtils } from '../utils/DocumentUtils.ts';

export class EditV2 extends AbstractEndpoint {
	protected override run(): void {
		this.SERVER.elysia.patch(
			this.PREFIX.concat('/:key'),
			async ({ headers, body, params }) => {
				DocumentUtils.validateSizeBetweenLimits(body);
				DocumentUtils.validateKey(params.key);

				const file = await DocumentUtils.retrieveDocument(params.key);
				const document = await DocumentUtils.documentReadV1(file);

				DocumentUtils.validateSecret(headers.secret, document.header.secretHash);

				const data = Bun.deflateSync(body as ArrayBuffer);

				document.data = document.header.sse ? CryptoUtils.encrypt(data, headers.secret) : data;

				return {
					edited: await DocumentUtils.documentWriteV1(Server.DOCUMENT_PATH + params.key, document)
						.then(() => true)
						.catch(() => false)
				};
			},
			{
				type: 'arrayBuffer',
				body: t.Any({ description: 'The new file', default: 'Hello, World!' }),
				params: t.Object({
					key: t.String({
						description: 'The document key',
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
					200: t.Object(
						{
							edited: t.Boolean({
								description: 'A boolean indicating if the edit was successful'
							})
						},
						{ description: 'A response object with a boolean' }
					),
					400: ErrorHandler.SCHEMA,
					403: ErrorHandler.SCHEMA,
					404: ErrorHandler.SCHEMA
				},
				detail: { summary: 'Edit document', tags: ['v2'] }
			}
		);
	}
}
