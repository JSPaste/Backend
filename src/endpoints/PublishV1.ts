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
				const secret = StringUtils.createSecret();

				DocumentUtils.validateSizeBetweenLimits(body);

				const bodyPack = Bun.deflateSync(body);
				const key = await StringUtils.createKey();

				await DocumentUtils.documentWrite(Server.DOCUMENT_PATH + key, {
					data: bodyPack,
					header: {
						dataHash: null,
						modHash: CryptoUtils.hash(secret),
						createdAt: Date.now()
					},
					version: 1
				});

				return { key, secret };
			},
			{
				type: 'text',
				body: t.String({ description: 'The file to be uploaded' }),
				response: {
					200: t.Object(
						{
							key: t.String({
								description: 'The generated key to access the document'
							}),
							secret: t.String({
								description: 'The generated secret to delete the document'
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
