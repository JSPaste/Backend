import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { t } from 'elysia';
import { ServerVersion } from '../types/Server.ts';
import { Error } from '../classes/Error.ts';
import type { Server } from '../classes/Server.ts';

export class AccessRawV1 extends AbstractEndpoint {
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
			response: {
				200: t.Any({
					description: 'The raw document',
					examples: ['Hello world']
				}),
				400: Error.schema,
				404: Error.schema
			},
			detail: {
				summary: 'Get raw document',
				tags: ['v1']
			}
		};

		this.server.getElysia.get(
			prefix.concat('/:key/raw'),
			async ({ set, params }) => {
				set.headers['Content-Type'] = 'text/plain';

				this.server.getDocumentHandler.setContext = set;
				return this.server.getDocumentHandler.access(
					{
						key: params.key,
						raw: true
					},
					ServerVersion.v1
				);
			},
			hook
		);
	}
}
