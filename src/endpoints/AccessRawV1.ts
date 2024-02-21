import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { t } from 'elysia';
import { ServerEndpointVersion } from '../types/Server.ts';
import { JSPError } from '../classes/JSPError.ts';
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
				400: JSPError.schema,
				404: JSPError.schema
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
					ServerEndpointVersion.v1
				);
			},
			hook
		);
	}
}
