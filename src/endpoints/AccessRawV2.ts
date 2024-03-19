import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { DocumentHandler } from '../classes/DocumentHandler.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';

export class AccessRawV2 extends AbstractEndpoint {
	protected override run(): void {
		// FIXME: Implicit "any" type on "set" & "params", careful...
		this.SERVER.elysia.get(
			this.PREFIX.concat('/:key/raw'),
			async ({ set, params }) => {
				set.headers['Content-Type'] = 'text/plain;charset=utf-8';

				return DocumentHandler.accessRaw({ key: params.key });
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
				headers: t.Optional(
					t.Object({
						password: t.Optional(
							t.String({
								description: 'The document password if aplicable',
								examples: ['aaaaa-bbbbb-ccccc-ddddd']
							})
						)
					})
				),
				query: t.Optional(
					t.Object({
						p: t.Optional(
							t.String({
								description:
									'The document password if aplicable, It is preferred to pass the password through headers, only use this method for support of web browsers.',
								examples: ['aaaaa-bbbbb-ccccc-ddddd']
							})
						)
					})
				),
				response: {
					200: t.Any({
						description: 'The raw document',
						examples: ['Hello world']
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
