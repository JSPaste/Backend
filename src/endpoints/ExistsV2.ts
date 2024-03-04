import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { JSPError } from '../classes/JSPError.ts';

export class ExistsV2 extends AbstractEndpoint {
	protected override run(): void {
		this.server.getElysia.get(
			this.prefix.concat('/:key/exists'),
			async ({ set, params }) => {
				return this.server.getDocumentHandler.setContext(set).exists(params);
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
					400: JSPError.schema
				},
				detail: { summary: 'Check document', tags: ['v2'] }
			}
		);
	}
}
