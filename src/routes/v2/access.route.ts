import { Elysia, t } from 'elysia';
import { ErrorSender } from '../../classes/ErrorSender';
import { errorSenderPlugin } from '../../plugins/errorSender.ts';
import { DocumentHandler } from '../../classes/DocumentHandler.ts';

export default new Elysia({
	name: 'routes:v2:documents:access'
})
	.use(errorSenderPlugin)
	.get(
		':id',
		async ({ errorSender, request, query: { p }, params: { id } }) =>
			DocumentHandler.handleAccess({
				errorSender,
				id,
				password: request.headers.get('password') || p || ''
			}),
		{
			params: t.Object({
				id: t.String({
					description: 'The document ID',
					examples: ['abc123']
				})
			}),
			headers: t.Optional(
				t.Object({
					password: t.Optional(
						t.String({
							description: 'The document password if aplicable',
							examples: ['aaaaa-bbbbb-ccccc-ddddd']
						})
					)
				})
			),
			query: t.Optional(
				t.Object({
					p: t.Optional(
						t.String({
							description:
								'The document password if aplicable, It is preferred to pass the password through headers, only use this method for support of web browsers.',
							examples: ['aaaaa-bbbbb-ccccc-ddddd']
						})
					)
				})
			),
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

			detail: { summary: 'Get document by ID', tags: ['v2'] }
		}
	)
	.get(
		':id/raw',
		async ({ errorSender, request, query: { p }, params: { id } }) =>
			DocumentHandler.handleRawAccess({
				errorSender,
				id,
				password: request.headers.get('password') || p || ''
			}),
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
			headers: t.Optional(
				t.Object({
					password: t.Optional(
						t.String({
							description: 'The document password if aplicable',
							examples: ['aaaaa-bbbbb-ccccc-ddddd']
						})
					)
				})
			),
			query: t.Optional(
				t.Object({
					p: t.Optional(
						t.String({
							description:
								'The document password if aplicable, It is preferred to pass the password through headers, only use this method for support of web browsers.',
							examples: ['aaaaa-bbbbb-ccccc-ddddd']
						})
					)
				})
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
				summary: 'Get raw document by ID',
				tags: ['v2']
			}
		}
	);
