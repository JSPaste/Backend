import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { t } from 'elysia';
import { ServerVersion } from '../types/Server.ts';
import { JSPError } from '../classes/JSPError.ts';
import type { Server } from '../classes/Server.ts';

export class AccessRawV2 extends AbstractEndpoint {
	public constructor(server: Server) {
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
				400: JSPError.schema,
				404: JSPError.schema
			},
			detail: {
				summary: 'Get raw document',
				tags: ['v2']
			}
		};

		this.server.getElysia.get(
			prefix.concat('/:key/raw'),
			async ({ set, headers, query, params }) => {
				set.headers['Content-Type'] = 'text/plain';

				this.server.getDocumentHandler.setContext = set;
				return this.server.getDocumentHandler.access(
					{
						key: params.key,
						password: headers.password || query.p || '',
						raw: true
					},
					ServerVersion.v2
				);
			},
			hook
		);
	}
}
