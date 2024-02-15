import { AbstractRoute } from '../classes/AbstractRoute.ts';
import { type Elysia, t } from 'elysia';

export class IndexV2 extends AbstractRoute {
	public constructor(server: Elysia) {
		super(server);
	}

	public override register(path: string): void {
		const hook = {
			response: t.String({
				description: 'A small welcome message with the current API version',
				examples: ['Welcome to JSPaste API v2']
			}),
			detail: { summary: 'Index', tags: ['v2'] }
		};

		this.server.get(path, () => 'Welcome to JSPaste API v2', hook);
	}
}
