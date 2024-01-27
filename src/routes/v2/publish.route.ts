import { Elysia, t } from 'elysia';
import { ErrorSender } from '../../classes/ErrorSender';
import { DocumentHandler } from '../../classes/DocumentHandler.ts';
import { defaultDocumentLifetime } from '../../utils/constants.ts';

export default new Elysia({
	name: 'routes:v2:documents:publish'
}).post(
	'',
	async ({ request, query, body }) =>
		DocumentHandler.handlePublish({
			body,
			selectedSecret: request.headers.get('secret') || '',
			lifetime: parseInt(
				request.headers.get('lifetime') || defaultDocumentLifetime.toString()
			),
			password: request.headers.get('password') || query['password'] || ''
		}),
	{
		type: 'arrayBuffer',
		body: t.Any({ description: 'The file to be uploaded' }),
		headers: t.Optional(
			t.Object({
				secret: t.Optional(
					t.String({
						description: 'The selected secret, if null a new secret will be generated',
						examples: ['aaaaa-bbbbb-ccccc-ddddd']
					})
				),
				password: t.Optional(
					t.String({
						description: 'The document password, can be null',
						examples: ['aaaaa-bbbbb-ccccc-ddddd']
					})
				),
				lifetime: t.Optional(
					t.Number({
						description: `Number in seconds that the document will exist before it is automatically deleted. Set to 0 to make the document permanent. If nothing is set, the default period is: ${defaultDocumentLifetime}`,
						examples: [60, 0]
					})
				)
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
