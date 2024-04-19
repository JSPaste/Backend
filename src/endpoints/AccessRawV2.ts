import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';
import { CryptoUtils } from '../utils/CryptoUtils.ts';
import { DocumentUtils } from '../utils/DocumentUtils.ts';

export class AccessRawV2 extends AbstractEndpoint {
	protected override run(): void {
		this.SERVER.elysia.get(
			this.PREFIX.concat('/:name/raw'),
			async ({ set, query, headers, params }) => {
				const options = {
					password: headers.password || query.p
				};

				const document = await DocumentUtils.documentReadV1(params.name);
				let data: Uint8Array;

				if (document.header.passwordHash) {
					if (!options.password) {
						throw ErrorHandler.send(ErrorCode.documentPasswordNeeded);
					}

					DocumentUtils.validatePassword(options.password, document.header.passwordHash);
					data = Bun.inflateSync(CryptoUtils.decrypt(document.data, options.password));
				} else {
					data = Bun.inflateSync(document.data);
				}

				set.headers['Content-Type'] = 'text/plain;charset=utf-8';
				return data;
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
