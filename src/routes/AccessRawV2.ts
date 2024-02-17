import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { type Elysia, t } from 'elysia';
import { DocumentHandler } from '../classes/DocumentHandler.ts';
import { ServerVersion } from '../types/Server.ts';
import { JSPError } from '../classes/JSPError.ts';

export class AccessRawV2 extends AbstractEndpoint {
	public constructor(server: Elysia) {
		super(server);
	}

	public override register(prefix: string): void {
		const hook = {
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
				400: JSPError.errorSchema,
				404: JSPError.errorSchema
			},
			detail: {
				summary: 'Get raw document',
				tags: ['v2']
			}
		};

		this.server.get(
			prefix.concat('/:key/raw'),
			async ({ set, request, query: { p }, params: { key } }) => {
				set.headers['Content-Type'] = 'text/plain';

				return DocumentHandler.handleAccess(
					set,
					{
						key,
						password: request.headers.get('password') || p || '',
						raw: true
					},
					ServerVersion.v2
				);
			},
			hook
		);
	}
}
