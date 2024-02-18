import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { t } from 'elysia';
import { JSPError } from '../classes/JSPError.ts';
import type { Server } from '../classes/Server.ts';

export class ExistsV2 extends AbstractEndpoint {
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
			response: {
				200: t.Boolean({ description: 'A boolean indicating if the document exists' }),
				400: JSPError.schema
			},
			detail: { summary: 'Check document', tags: ['v2'] }
		};

		this.server.getElysia.get(
			prefix.concat('/:key/exists'),
			async ({ set, params }) => {
				this.server.getDocumentHandler.setContext = set;
				return this.server.getDocumentHandler.exists(params);
			},
			hook
		);
	}
}
