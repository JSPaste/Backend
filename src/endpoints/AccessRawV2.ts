import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';
import { CryptoUtils } from '../utils/CryptoUtils.ts';
import { DocumentUtils } from '../utils/DocumentUtils.ts';

export class AccessRawV2 extends AbstractEndpoint {
	protected override run(): void {
		this.SERVER.elysia.get(
			this.PREFIX.concat('/:key/raw'),
			async ({ set, query, headers, params }) => {
				const options = {
					password: headers.password || query.p
				};

				DocumentUtils.validateKey(params.key);

				const file = await DocumentUtils.retrieveDocument(params.key);
				const document = await DocumentUtils.documentRead(file);
				let data = document.data;

				if (document.header.dataHash) {
					DocumentUtils.validatePassword(options.password, document.header.dataHash);

					if (options.password) {
						data = CryptoUtils.decrypt(document.data, options.password);
					}
				}

				data = Bun.inflateSync(data);

				set.headers['Content-Type'] = 'text/plain;charset=utf-8';
				return new TextDecoder().decode(data);
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
					password: t.Optional(
						t.String({
							description: 'The document password if aplicable',
							examples: ['aaaaa-bbbbb-ccccc-ddddd']
						})
					)
				}),
				query: t.Object({
					p: t.Optional(
						t.String({
							description:
								'The document password if aplicable, It is preferred to pass the password through headers, only use this method for support of web browsers.',
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
