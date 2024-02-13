import { RouteHandler } from '../classes/RouteHandler.ts';
import { type Elysia, t } from 'elysia';

export class IndexV1 extends RouteHandler {
	public constructor(server: Elysia) {
		super(server);
	}

	public override register(path: string): void {
		this.server.get(
			path,
			() => {
				return 'Welcome to JSPaste API v1';
			},
			{
				response: t.String({
					description: 'A small welcome message with the current API version',
					examples: ['Welcome to JSPaste API v1']
				}),
				detail: { summary: 'Index', tags: ['v1'] }
			}
		);
	}
}
