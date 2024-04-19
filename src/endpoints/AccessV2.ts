import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';
import { Server } from '../classes/Server.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';
import { CryptoUtils } from '../utils/CryptoUtils.ts';
import { DocumentUtils } from '../utils/DocumentUtils.ts';

export class AccessV2 extends AbstractEndpoint {
	protected override run(): void {
		this.SERVER.elysia.get(
			this.PREFIX.concat('/:name'),
			async ({ headers, params }) => {
				DocumentUtils.validateKey(params.name);

				const file = await DocumentUtils.retrieveDocument(params.name);
				const document = await DocumentUtils.documentReadV1(file);
				let data: string | Uint8Array = document.data;

				if (document.header.dataHash) {
					if (!headers.password) {
						throw ErrorHandler.send(ErrorCode.documentPasswordNeeded);
					}

					DocumentUtils.validatePassword(headers.password, document.header.dataHash);
					data = CryptoUtils.decrypt(document.data, headers.password);
				}

				data = Buffer.from(Bun.inflateSync(data)).toString();

				return {
					key: params.name,
					data: data,
					url: Server.HOSTNAME.concat('/', params.name),
					// Deprecated, for compatibility reasons will be kept to 0
					expirationTimestamp: 0
				};
			},
			{
				params: t.Object({
					name: t.String({
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
								description: 'DEPRECATED! UNIX timestamp with the expiration date in milliseconds.'
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
