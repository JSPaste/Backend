import { Elysia, t } from 'elysia';
import { ErrorSender } from '../../classes/ErrorSender';
import { type AccessResponse, DocumentHandler } from '../../classes/DocumentHandler.ts';
import { errorSenderPlugin } from '../../plugins/errorSender.ts';

export default new Elysia({
	name: 'routes:v1:documents:access'
})
	.use(errorSenderPlugin)
	.get(
		':id',
		async ({ errorSender, params: { id } }) =>
			DocumentHandler.handleAccess({ errorSender, id }),
		{
			params: t.Object({
				id: t.String({
					description: 'The document ID',
					examples: ['abc123']
				})
			}),
			response: {
				200: t.Object(
					{
						key: t.String({
							description: 'The key of the document',
							examples: ['abc123']
						}),
						data: t.String({
							description: 'The document',
							examples: ['Hello world']
						})
					},
					{ description: 'The document object' }
				),
				400: ErrorSender.errorType(),
				404: ErrorSender.errorType()
			},
			detail: { summary: 'Get document by ID', tags: ['v1'] }
		}
	)
	.get(
		':id/raw',
		async ({ errorSender, params: { id } }) =>
			DocumentHandler.handleAccess({ errorSender, id }).then((res) =>
				ErrorSender.isJSPError(res) ? res : (<AccessResponse>res).data
			),
		{
			params: t.Object(
				{
					id: t.String({
						description: 'The document ID',
						examples: ['abc123']
					})
				},
				{
					description: 'The request parameters',
					examples: [{ id: 'abc123' }]
				}
			),
			response: {
				200: t.Any({
					description: 'The raw document',
					examples: ['Hello world']
				}),
				400: ErrorSender.errorType(),
				404: ErrorSender.errorType()
			},
			detail: {
				summary: 'Get raw document by ID',
				tags: ['v1']
			}
		}
	);
