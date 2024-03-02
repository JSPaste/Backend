import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import type { Server } from '../classes/Server.ts';

export class IndexV1 extends AbstractEndpoint {
	public constructor(server: Server) {
		super(server);
	}

	protected override run(): void {
		this.server.getElysia.get(this.prefix, 'Welcome to JSPaste API v1', {
			response: t.String({
				description: 'A small welcome message with the current API version',
				examples: ['Welcome to JSPaste API v1']
			}),
			detail: { summary: 'Index', tags: ['v1'] }
		});
	}
}
