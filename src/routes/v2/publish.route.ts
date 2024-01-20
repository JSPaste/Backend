import { Elysia, t } from 'elysia';
import { ErrorSender } from '../../classes/ErrorSender';
import { DocumentHandler } from '../../classes/DocumentHandler.ts';

export default new Elysia({
	name: 'routes:v2:documents:publish'
}).post(
	'',
	async ({ request, query, body }) =>
		DocumentHandler.handlePublish({
			body,
			selectedSecret: request.headers.get('secret') || '',
			password: request.headers.get('password') || query['password'] || ''
		}),
	{
		type: 'arrayBuffer',
		body: t.Any({ description: 'The file to be uploaded' }),
		headers: t.Optional(
			t.Object({
				secret: t.String({
					description: 'The selected secret, if null a new secret will be generated',
					examples: ['aaaaa-bbbbb-ccccc-ddddd']
				}),
				password: t.String({
					description: 'The document password, can be null',
					examples: ['aaaaa-bbbbb-ccccc-ddddd']
				})
			})
		),
		response: {
			200: t.Object(
				{
					key: t.String({
						description: 'The generated key to access the document'
					}),
					secret: t.String({
						description: 'The generated secret to delete the document'
					})
				},
				{ description: 'An object with a key and a secret for the document' }
			),
			400: ErrorSender.errorType()
		},
		detail: { summary: 'Publish document', tags: ['v2'] }
	}
);
