import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';
import { Server } from '../classes/Server.ts';
import { CryptoUtils } from '../utils/CryptoUtils.ts';
import { DocumentUtils } from '../utils/DocumentUtils.ts';
import { StringUtils } from '../utils/StringUtils.ts';

export class PublishV1 extends AbstractEndpoint {
	protected override run(): void {
		this.SERVER.elysia.post(
			this.PREFIX,
			async ({ body }) => {
				DocumentUtils.validateSizeBetweenLimits(body);

				const key = await StringUtils.createKey();
				const secret = StringUtils.createSecret();
				const data = Bun.deflateSync(body);

				await DocumentUtils.documentWriteV1(Server.DOCUMENT_PATH + key, {
					data: data,
					header: {
						secretHash: CryptoUtils.hash(secret),
						sse: false,
						createdAt: Date.now()
					}
				});

				return { key, secret };
			},
			{
				type: 'arrayBuffer',
				body: t.Any({ description: 'The file to be uploaded' }),
				response: {
					200: t.Object(
						{
							key: t.String({
								description: 'The generated key to access the document'
							}),
							secret: t.String({
								description: 'The document secret to modify the document'
							})
						},
						{
							description: 'An object with a key and a secret for the document'
						}
					),
					400: ErrorHandler.SCHEMA
				},
				detail: { summary: 'Publish document', tags: ['v1'], deprecated: true }
			}
		);
	}
}
