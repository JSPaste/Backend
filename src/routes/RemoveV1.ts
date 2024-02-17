import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { type Elysia, t } from 'elysia';
import { DocumentHandler } from '../classes/DocumentHandler.ts';
import { JSPError } from '../classes/JSPError.ts';

export class RemoveV1 extends AbstractEndpoint {
	public constructor(server: Elysia) {
		super(server);
	}

	public override register(prefix: string): void {
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
				400: JSPError.errorSchema,
				403: JSPError.errorSchema,
				404: JSPError.errorSchema
			},
			detail: { summary: 'Remove document', tags: ['v1'] }
		};

		this.server.delete(
			prefix.concat('/:key'),
			async ({ set, request, params: { key } }) =>
				DocumentHandler.handleRemove(set, {
					key,
					secret: request.headers.get('secret') || ''
				}),
			hook
		);
	}
}
