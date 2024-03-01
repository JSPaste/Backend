import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { t } from 'elysia';
import type { Server } from '../classes/Server.ts';

export class IndexV2 extends AbstractEndpoint {
	public constructor(server: Server) {
		super(server);
	}

	protected override run(): void {
		this.server.getElysia.get(this.prefix, 'Welcome to JSPaste API v2', {
			response: t.String({
				description: 'A small welcome message with the current API version',
				examples: ['Welcome to JSPaste API v2']
			}),
			detail: { summary: 'Index', tags: ['v2'] }
		});
	}
}
