import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { JSPError } from '../classes/JSPError.ts';

export class RemoveV1 extends AbstractEndpoint {
	protected override run(): void {
		this.server.getElysia.delete(
			this.prefix.concat('/:key'),
			async ({ set, headers, params }) => {
				return this.server.getDocumentHandler.setContext(set).remove({
					key: params.key,
					secret: headers.secret
				});
			},
			{
				params: t.Object({
					key: t.String({
						description: 'The document key',
						examples: ['abc123']
					})
				}),
				headers: t.Object({
					secret: t.String({
						description: 'The document secret',
						examples: ['aaaaa-bbbbb-ccccc-ddddd']
					})
				}),
				response: {
					200: t.Object(
						{
							removed: t.Boolean({
								description: 'A boolean indicating if the deletion was successful'
							})
						},
						{ description: 'A response object with a boolean' }
					),
					400: JSPError.schema,
					403: JSPError.schema,
					404: JSPError.schema
				},
				detail: { summary: 'Remove document', tags: ['v1'] }
			}
		);
	}
}
