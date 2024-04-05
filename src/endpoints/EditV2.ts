import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { DocumentHandler } from '../classes/DocumentHandler.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';

export class EditV2 extends AbstractEndpoint {
	protected override run(): void {
		this.SERVER.elysia.patch(
			this.PREFIX.concat('/:key'),
			async ({ query, headers, body, params }) => {
				return DocumentHandler.edit({
					key: params.key,
					body: body,
					secret: headers.secret || query.secret
				});
			},
			{
				type: 'arrayBuffer',
				body: t.Any({ description: 'The new file' }),
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
				query: t.Object({
					secret: t.Optional(
						t.String({
							description: 'The document secret.',
							examples: ['aaaaa-bbbbb-ccccc-ddddd']
						})
					)
				}),
				response: {
					200: t.Object(
						{
							edited: t.Boolean({
								description: 'A boolean indicating if the edit was successful'
							})
						},
						{ description: 'A response object with a boolean' }
					),
					400: ErrorHandler.SCHEMA,
					403: ErrorHandler.SCHEMA,
					404: ErrorHandler.SCHEMA
				},
				detail: { summary: 'Edit document', tags: ['v2'] }
			}
		);
	}
}
