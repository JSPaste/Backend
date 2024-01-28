import { Elysia, t } from 'elysia';
import { ErrorSender } from '../../classes/ErrorSender';
import { DocumentHandler } from '../../classes/DocumentHandler.ts';
import { errorSenderPlugin } from '../../plugins/errorSender.ts';
import { APIVersions } from '../../utils/constants.ts';

export default new Elysia({
	name: 'routes:v1:documents:access'
})
	.use(errorSenderPlugin)
	.get(
		':key',
		async ({ errorSender, params: { key } }) =>
			DocumentHandler.handleAccess({ errorSender, key: key }, APIVersions.v1),
		{
			params: t.Object({
				key: t.String({
					description: 'The document key',
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
			detail: { summary: 'Get document', tags: ['v1'] }
		}
	)
	.get(
		':key/raw',
		async ({ errorSender, params: { key } }) =>
			DocumentHandler.handleRawAccess({ errorSender, key: key }, APIVersions.v1),
		{
			params: t.Object(
				{
					key: t.String({
						description: 'The document key',
						examples: ['abc123']
					})
				},
				{
					description: 'The request parameters',
					examples: [{ key: 'abc123' }]
				}
			),
			response: {
				200: t.String({
					description: 'The raw document',
					examples: ['Hello world']
				}),
				400: ErrorSender.errorType(),
				404: ErrorSender.errorType()
			},
			detail: {
				summary: 'Get raw document',
				tags: ['v1']
			}
		}
	);
