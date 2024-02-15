import { AbstractRoute } from '../classes/AbstractRoute.ts';
import { type Elysia, t } from 'elysia';
import { ErrorSender } from '../classes/ErrorSender.ts';
import { DocumentHandler } from '../classes/DocumentHandler.ts';

export class RemoveV1 extends AbstractRoute {
	public constructor(server: Elysia) {
		super(server);
	}

	public override register(path: string): void {
		const hook = {
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
				400: ErrorSender.errorType(),
				403: ErrorSender.errorType(),
				404: ErrorSender.errorType()
			},
			detail: { summary: 'Remove document', tags: ['v1'] }
		};

		this.server.delete(
			path.concat('/:key'),
			async ({ errorSender, request, params: { key } }) =>
				DocumentHandler.handleRemove({
					errorSender,
					key,
					secret: request.headers.get('secret') || ''
				}),
			hook
		);
	}
}
