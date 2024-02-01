import { Elysia, t } from 'elysia';
import { ErrorSender } from '../../classes/ErrorSender';
import { DocumentHandler } from '../../classes/DocumentHandler.ts';
import { errorSenderPlugin } from '../../plugins/errorSender.ts';

export default new Elysia({
	name: 'routes:v2:documents:edit'
})
	.use(errorSenderPlugin)
	.patch(
		':key',
		async ({ errorSender, request, body, params: { key } }) =>
			DocumentHandler.handleEdit({
				errorSender,
				key,
				newBody: body,
				secret: request.headers.get('secret') ?? ''
			}),
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
				400: ErrorSender.errorType(),
				403: ErrorSender.errorType(),
				404: ErrorSender.errorType()
			},
			detail: { summary: 'Edit document', tags: ['v2'] }
		}
	);
