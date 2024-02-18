import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { t } from 'elysia';
import { JSPError } from '../classes/JSPError.ts';
import type { Server } from '../classes/Server.ts';

export class EditV2 extends AbstractEndpoint {
	public constructor(server: Server) {
		super(server);
	}

	public override register(prefix: string): void {
		const hook = {
			type: 'arrayBuffer',
			body: t.Any({ description: 'The new file' }),
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
						edited: t.Boolean({
							description: 'A boolean indicating if the edit was successful'
						})
					},
					{ description: 'A response object with a boolean' }
				),
				400: JSPError.schema,
				403: JSPError.schema,
				404: JSPError.schema
			},
			detail: { summary: 'Edit document', tags: ['v2'] }
		};

		this.server.getElysia.patch(
			prefix.concat('/:key'),
			async ({ set, headers, body, params }) => {
				this.server.getDocumentHandler.setContext = set;
				return this.server.getDocumentHandler.edit({
					key: params.key,
					newBody: body,
					secret: headers.secret
				});
			},
			hook
		);
	}
}