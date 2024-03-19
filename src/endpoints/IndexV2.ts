import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';

export class IndexV2 extends AbstractEndpoint {
	protected override run(): void {
		this.SERVER.elysia.get(this.PREFIX, 'Welcome to JSPaste API v2', {
			response: t.String({
				description: 'A small welcome message with the current API version',
				examples: ['Welcome to JSPaste API v2']
			}),
			detail: { summary: 'Index', tags: ['v2'] }
		});
	}
}
