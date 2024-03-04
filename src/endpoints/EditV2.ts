import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { MessageHandler } from '../classes/MessageHandler.ts';

export class EditV2 extends AbstractEndpoint {
	protected override run(): void {
		this.server.getElysia.patch(
			this.prefix.concat('/:key'),
			async ({ headers, body, params }) => {
				return this.server.getDocumentHandler.edit({
					key: params.key,
					body: body,
					secret: headers.secret
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
				response: {
					200: t.Object(
						{
							edited: t.Boolean({
								description: 'A boolean indicating if the edit was successful'
							})
						},
						{ description: 'A response object with a boolean' }
					),
					400: MessageHandler.schema,
					403: MessageHandler.schema,
					404: MessageHandler.schema
				},
				detail: { summary: 'Edit document', tags: ['v2'] }
			}
		);
	}
}
