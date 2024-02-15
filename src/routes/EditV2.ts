import { AbstractRoute } from '../classes/AbstractRoute.ts';
import { type Elysia, t } from 'elysia';
import { DocumentHandler } from '../classes/DocumentHandler.ts';
import { ErrorSender } from '../classes/ErrorSender.ts';

export class EditV2 extends AbstractRoute {
	public constructor(server: Elysia) {
		super(server);
	}

	public override register(path: string): void {
		const hook = {
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
				400: ErrorSender.errorType(),
				403: ErrorSender.errorType(),
				404: ErrorSender.errorType()
			},
			detail: { summary: 'Edit document', tags: ['v2'] }
		};

		this.server.patch(
			path.concat('/:key'),
			async ({ errorSender, request, body, params: { key } }) =>
				DocumentHandler.handleEdit({
					errorSender,
					key,
					newBody: body,
					secret: request.headers.get('secret') || ''
				}),
			hook
		);
	}
}
