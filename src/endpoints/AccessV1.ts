import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { JSPError } from '../classes/JSPError.ts';
import type { Server } from '../classes/Server.ts';
import { ServerEndpointVersion } from '../types/Server.ts';

export class AccessV1 extends AbstractEndpoint {
	public constructor(server: Server) {
		super(server);
	}

	protected override run(): void {
		this.server.getElysia.get(
			this.prefix.concat('/:key'),
			async ({ set, params }) => {
				return this.server.getDocumentHandler
					.setContext(set)
					.setVersion(ServerEndpointVersion.v1)
					.access({ key: params.key });
			},
			{
				params: t.Object({
					key: t.String({
						description: 'The document key',
						examples: ['abc123']
					})
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
								examples: ['Hello world']
							})
						},
						{ description: 'The document object' }
					),
					400: JSPError.schema,
					404: JSPError.schema
				},
				detail: { summary: 'Get document', tags: ['v1'] }
			}
		);
	}
}
