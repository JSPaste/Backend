import { RouteHandler } from '../classes/RouteHandler.ts';
import { type Elysia, t } from 'elysia';

export class IndexV1 extends RouteHandler {
	private readonly path: string;

	public constructor(server: Elysia, path: string) {
		super(server);
		this.path = path;
	}

	public override group(group: string): this {
		this.server.group(group, (prefix) => prefix.use(this.register(this.path)));
		return this;
	}

	public override register(path: string): Elysia {
		return this.server.get(
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
