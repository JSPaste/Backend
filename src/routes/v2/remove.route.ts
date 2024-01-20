import { Elysia, t } from 'elysia';
import { ErrorSender } from '../../classes/ErrorSender';
import { DocumentHandler } from '../../classes/DocumentHandler.ts';

export default new Elysia({
	name: 'routes:v2:documents:remove'
}).delete(
	':id',
	async ({ request, params: { id } }) =>
		DocumentHandler.handleRemove({ id, secret: request.headers.get('secret') || '' }),
	{
		params: t.Object({
			id: t.String({
				description: 'The document ID',
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
					message: t.String({
						description: 'A message saying that the deletion was successful'
					})
				},
				{ description: 'A response object with a message' }
			),
			400: ErrorSender.errorType(),
			403: ErrorSender.errorType()
		},
		detail: { summary: 'Remove document by ID', tags: ['v2'] }
	}
);
