import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { type Elysia, t } from 'elysia';
import { DocumentHandler } from '../classes/DocumentHandler.ts';
import { genericErrorType } from '../utils/constants.ts';

export class EditV2 extends AbstractEndpoint {
	public constructor(server: Elysia) {
		super(server);
	}

	public override register(prefix: string): void {
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
				400: genericErrorType,
				403: genericErrorType,
				404: genericErrorType
			},
			detail: { summary: 'Edit document', tags: ['v2'] }
		};

		this.server.patch(
			prefix.concat('/:key'),
			async ({ set, request, body, params: { key } }) =>
				DocumentHandler.handleEdit(set, {
					key,
					newBody: body,
					secret: request.headers.get('secret') || ''
				}),
			hook
		);
	}
}
