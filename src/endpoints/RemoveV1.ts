import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { t } from 'elysia';
import { JSPError } from '../classes/JSPError.ts';
import type { Server } from '../classes/Server.ts';

export class RemoveV1 extends AbstractEndpoint {
	public constructor(server: Server) {
		super(server);
	}

	public override register(prefix: string): void {
		const hook = {
			params: t.Object({
				key: t.String({
					description: 'The document key',
					examples: ['abc123']
				})
			}),
			headers: t.Object({
				secret: t.String({
					description: 'The document secret',
					examples: ['aaaaa-bbbbb-ccccc-ddddd']
				})
			}),
			response: {
				200: t.Object(
					{
						removed: t.Boolean({
							description: 'A boolean indicating if the deletion was successful'
						})
					},
					{ description: 'A response object with a boolean' }
				),
				400: JSPError.schema,
				403: JSPError.schema,
				404: JSPError.schema
			},
			detail: { summary: 'Remove document', tags: ['v1'] }
		};

		this.server.getElysia.delete(
			prefix.concat('/:key'),
			async ({ set, headers, params }) => {
				this.server.getDocumentHandler.setContext = set;
				return this.server.getDocumentHandler.remove({
					key: params.key,
					secret: headers.secret
				});
			},
			hook
		);
	}
}
