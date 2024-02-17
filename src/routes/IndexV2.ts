import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { type Elysia, t } from 'elysia';

export class IndexV2 extends AbstractEndpoint {
	public constructor(server: Elysia) {
		super(server);
	}

	public override register(prefix: string): void {
		const hook = {
			response: t.String({
				description: 'A small welcome message with the current API version',
				examples: ['Welcome to JSPaste API v2']
			}),
			detail: { summary: 'Index', tags: ['v2'] }
		};

		this.server.get(prefix, () => 'Welcome to JSPaste API v2', hook);
	}
}
