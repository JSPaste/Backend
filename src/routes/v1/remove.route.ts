import { Elysia, t } from 'elysia';
import { ErrorSender } from '../../classes/ErrorSender';
import { DocumentHandler } from '../../classes/DocumentHandler.ts';
import { errorSenderPlugin } from '../../plugins/errorSender.ts';

export default new Elysia({
	name: 'routes:v1:documents:remove'
})
	.use(errorSenderPlugin)
	.delete(
		':key',
		async ({ errorSender, request, params: { key } }) =>
			DocumentHandler.handleRemove({
				errorSender,
				key,
				secret: request.headers.get('secret') || ''
			}),
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
				400: ErrorSender.errorType(),
				403: ErrorSender.errorType(),
				404: ErrorSender.errorType()
			},
			detail: { summary: 'Remove document', tags: ['v1'] }
		}
	);
