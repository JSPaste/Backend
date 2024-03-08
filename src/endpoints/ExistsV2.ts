import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';

export class ExistsV2 extends AbstractEndpoint {
	protected override run(): void {
		this.SERVER.elysia.get(
			this.PREFIX.concat('/:key/exists'),
			async ({ params, error }) => {
				return this.SERVER.documentHandler.setError(error).exists(params);
			},
			{
				params: t.Object({
					key: t.String({
						description: 'The document key',
						examples: ['abc123']
					})
				}),
				response: {
					200: t.Boolean({
						description: 'A boolean indicating if the document exists'
					}),
					400: ErrorHandler.SCHEMA
				},
				detail: { summary: 'Check document', tags: ['v2'] }
			}
		);
	}
}
