import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { t } from 'elysia';
import type { Server } from '../classes/Server.ts';

export class IndexV1 extends AbstractEndpoint {
	public constructor(server: Server) {
		super(server);
	}

	public override register(prefix: string): void {
		const hook = {
			response: t.String({
				description: 'A small welcome message with the current API version',
				examples: ['Welcome to JSPaste API v1']
			}),
			detail: { summary: 'Index', tags: ['v1'] }
		};

		this.server.getElysia.get(prefix, 'Welcome to JSPaste API v1', hook);
	}
}
