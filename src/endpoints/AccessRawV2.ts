import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';
import { CryptoUtils } from '../utils/CryptoUtils.ts';
import { DocumentUtils } from '../utils/DocumentUtils.ts';

export class AccessRawV2 extends AbstractEndpoint {
	protected override run(): void {
		this.SERVER.elysia.get(
			this.PREFIX.concat('/:key/raw'),
			async ({ set, query, headers, params }) => {
				const options = {
					secret: headers.secret || query.s
				};

				DocumentUtils.validateKey(params.key);

				const file = await DocumentUtils.retrieveDocument(params.key);
				const document = await DocumentUtils.documentReadV1(file);
				let data: string | Uint8Array = document.data;

				if (document.header.sse) {
					if (!options.secret) {
						throw ErrorHandler.send(ErrorCode.documentPasswordNeeded);
					}

					DocumentUtils.validateSecret(options.secret, document.header.secretHash);
					data = CryptoUtils.decrypt(document.data, options.secret);
				}

				data = Buffer.from(Bun.inflateSync(data)).toString();

				set.headers['Content-Type'] = 'text/plain;charset=utf-8';
				return data;
			},
			{
				params: t.Object(
					{
						key: t.String({
							description: 'The document key',
							examples: ['abc123']
						})
					},
					{
						description: 'The request parameters',
						examples: [{ key: 'abc123' }]
					}
				),
				headers: t.Object({
					secret: t.Optional(
						t.String({
							description: 'The document secret if aplicable',
							examples: ['aaaaa-bbbbb-ccccc-ddddd']
						})
					)
				}),
				query: t.Object({
					s: t.Optional(
						t.String({
							description:
								'The document secret if aplicable, It is preferred to pass the password through headers, only use this method for support of web browsers.',
							examples: ['aaaaa-bbbbb-ccccc-ddddd']
						})
					)
				}),
				response: {
					200: t.Any({
						description: 'The raw document',
						examples: ['Hello, World!']
					}),
					400: ErrorHandler.SCHEMA,
					404: ErrorHandler.SCHEMA
				},
				detail: {
					summary: 'Get raw document',
					tags: ['v2']
				}
			}
		);
	}
}
