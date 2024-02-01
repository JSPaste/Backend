import { Elysia, t } from 'elysia';
import { ErrorSender } from '../../classes/ErrorSender';
import { DocumentHandler } from '../../classes/DocumentHandler.ts';
import { APIVersions, defaultDocumentLifetime } from '../../utils/constants.ts';
import { errorSenderPlugin } from '../../plugins/errorSender.ts';

export default new Elysia({
	name: 'routes:v2:documents:publish'
})
	.use(errorSenderPlugin)
	.post(
		'',
		async ({ errorSender, request, query, body }) =>
			DocumentHandler.handlePublish(
				{
					errorSender,
					body,
					selectedSecret: request.headers.get('secret') || '',
					lifetime: parseInt(
						request.headers.get('lifetime') || defaultDocumentLifetime.toString()
					),
					password: request.headers.get('password') || query['password'] || ''
				},
				APIVersions.v2
			),
		{
			type: 'arrayBuffer',
			body: t.Any({
				description: 'The file to be uploaded'
			}),
			headers: t.Optional(
				t.Object({
					secret: t.Optional(
						t.String({
							description:
								'The selected secret, if null a new secret will be generated',
							examples: ['aaaaa-bbbbb-ccccc-ddddd']
						})
					),
					password: t.Optional(
						t.String({
							description: 'The document password, can be null',
							examples: ['abc123']
						})
					),
					lifetime: t.Optional(
						t.Numeric({
							description: `Number in seconds that the document will exist before it is automatically removed. Set to 0 to make the document permanent. If nothing is set, the default period is: ${defaultDocumentLifetime}`,
							examples: [60, 0]
						})
					)
				})
			),
			response: {
				200: t.Object(
					{
						key: t.String({
							description: 'The generated key to access the document',
							examples: ['abc123']
						}),
						secret: t.String({
							description: 'The generated secret to delete the document',
							examples: ['aaaaa-bbbbb-ccccc-ddddd']
						}),
						url: t.Optional(
							t.String({
								description: 'The URL for viewing the document on the web',
								examples: ['https://jspaste.eu/abc123']
							})
						),
						expirationTimestamp: t.Optional(
							t.Number({
								description:
									'UNIX timestamp with the expiration date in milliseconds. Undefined if the document is permanent.',
								examples: [60, 0]
							})
						)
					},
					{
						description:
							'An object with a key, a secret, the display URL and an expiration timestamp for the document'
					}
				),
				400: ErrorSender.errorType()
			},
			detail: { summary: 'Publish document', tags: ['v2'] }
		}
	);
