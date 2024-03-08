import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';

export class IndexV1 extends AbstractEndpoint {
	protected override run(): void {
		this.SERVER.elysia.get(this.PREFIX, 'Welcome to JSPaste API v1', {
			response: t.String({
				description: 'A small welcome message with the current API version',
				examples: ['Welcome to JSPaste API v1']
			}),
			detail: { summary: 'Index', tags: ['v1'] }
		});
	}
}
