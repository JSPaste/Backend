import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';
import { Server } from '../classes/Server.ts';
import { CryptoUtils } from '../utils/CryptoUtils.ts';
import { DocumentUtils } from '../utils/DocumentUtils.ts';

export class AccessV2 extends AbstractEndpoint {
	protected override run(): void {
		this.SERVER.elysia.get(
			this.PREFIX.concat('/:key'),
			async ({ headers, params }) => {
				DocumentUtils.validateKey(params.key);

				const file = await DocumentUtils.retrieveDocument(params.key);
				const document = await DocumentUtils.documentRead(file);
				let data = document.data;

				if (document.header.dataHash) {
					DocumentUtils.validatePassword(headers.password, document.header.dataHash);

					if (headers.password) {
						data = CryptoUtils.decrypt(document.data, headers.password);
					}
				}

				data = Bun.inflateSync(data);

				return {
					key: params.key,
					data: new TextDecoder().decode(data),
					url: Server.HOSTNAME.concat('/', params.key),
					// Deprecated, for compatibility reasons will be kept to 0
					expirationTimestamp: 0
				};
			},
			{
				params: t.Object({
					key: t.String({
						description: 'The document key',
						examples: ['abc123']
					})
				}),
				headers: t.Object({
					password: t.Optional(
						t.String({
							description: 'The document password if aplicable',
							examples: ['abc123']
						})
					)
				}),
				response: {
					200: t.Object(
						{
							key: t.String({
								description: 'The key of the document',
								examples: ['abc123']
							}),
							data: t.String({
								description: 'The document',
								examples: ['Hello, World!']
							}),
							url: t.String({
								description: 'The URL for viewing the document on the web',
								examples: ['https://jspaste.eu/abc123']
							}),
							expirationTimestamp: t.Numeric({
								description:
									'DEPRECATED! UNIX timestamp with the expiration date in milliseconds. Undefined if the document is permanent.'
							})
						},
						{
							description:
								'The document object, including the key, the data, the display URL and an expiration timestamp for the document'
						}
					),
					400: ErrorHandler.SCHEMA,
					404: ErrorHandler.SCHEMA
				},
				detail: { summary: 'Get document', tags: ['v2'] }
			}
		);
	}
}
