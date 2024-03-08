import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';
import { Server } from '../classes/Server.ts';
import { ServerEndpointVersion } from '../types/Server.ts';

export class PublishV2 extends AbstractEndpoint {
	protected override run(): void {
		this.SERVER.elysia.post(
			this.PREFIX,
			async ({ headers, body, error }) => {
				return this.SERVER.documentHandler.setVersion(ServerEndpointVersion.V2).setError(error).publish({
					body: body,
					selectedKey: headers.key,
					selectedKeyLength: headers.keyLength,
					selectedSecret: headers.secret,
					lifetime: headers.lifetime,
					password: headers.password
				});
			},
			{
				type: 'arrayBuffer',
				body: t.Any({
					description: 'The file to be uploaded'
				}),
				headers: t.Object({
					key: t.Optional(
						t.String({
							description: 'A custom key, if null, a new key will be generated',
							examples: ['abc123']
						})
					),
					keyLength: t.Optional(
						t.Numeric({
							minimum: Server.DOCUMENT_KEY_LENGTH_MIN,
							maximum: Server.DOCUMENT_KEY_LENGTH_MAX,
							description:
								'If a custom key is not set, this will determine the key length of the automatically generated key',
							examples: ['20', '4']
						})
					),
					secret: t.Optional(
						t.String({
							description: 'A custom secret, if null, a new secret will be generated',
							examples: ['aaaaa-bbbbb-ccccc-ddddd']
						})
					),
					password: t.Optional(
						t.String({
							description:
								'A custom password for the document, if null, anyone who has the key will be able to see the content of the document',
							examples: ['abc123']
						})
					),
					lifetime: t.Optional(
						t.Numeric({
							description: `Number in seconds that the document will exist before it is automatically removed. Set to 0 to make the document permanent. If nothing is set, the default period is: ${Server.DOCUMENT_MAX_TIME}`,
							examples: ['60', '0']
						})
					)
				}),
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
								t.Numeric({
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
					400: ErrorHandler.SCHEMA
				},
				detail: { summary: 'Publish document', tags: ['v2'] }
			}
		);
	}
}
