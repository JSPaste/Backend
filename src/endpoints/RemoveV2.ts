import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';

export class RemoveV2 extends AbstractEndpoint {
	protected override run(): void {
		this.SERVER.elysia.delete(
			this.PREFIX.concat('/:key'),
			async ({ headers, params, error }) => {
				return this.SERVER.documentHandler.setError(error).remove({
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
					400: ErrorHandler.SCHEMA,
					403: ErrorHandler.SCHEMA,
					404: ErrorHandler.SCHEMA
				},
				detail: { summary: 'Remove document', tags: ['v2'] }
			}
		);
	}
}
