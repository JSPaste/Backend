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
				const document = await DocumentUtils.documentReadV1(params.name);

				let data: Uint8Array;

				if (document.header.dataHash) {
					if (!headers.password) {
						throw ErrorHandler.send(ErrorCode.documentPasswordNeeded);
					}

					DocumentUtils.validatePassword(headers.password, document.header.dataHash);

					data = CryptoUtils.decrypt(document.data, headers.password);
				} else {
					data = document.data;
				}

				return {
					key: params.name,
					data: Buffer.from(Bun.inflateSync(data)).toString(),
					url: Server.HOSTNAME.concat('/', params.name),
					// Deprecated, for compatibility reasons will be kept to 0
					expirationTimestamp: 0
				};
			},
			{
				params: t.Object({
					name: t.String({
						description: 'The document name',
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
								description: 'The name of the document',
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
								'The document object, including the name, the data, the display URL and an expiration timestamp for the document'
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
