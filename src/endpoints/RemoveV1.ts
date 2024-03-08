import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';

export class RemoveV1 extends AbstractEndpoint {
	protected override run(): void {
		this.server.getElysia.delete(
			this.prefix.concat('/:key'),
			async ({ headers, params, error }) => {
				return this.server.getDocumentHandler.setError(error).remove({
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
					400: ErrorHandler.schema,
					403: ErrorHandler.schema,
					404: ErrorHandler.schema
				},
				detail: { summary: 'Remove document', tags: ['v1'] }
			}
		);
	}
}
