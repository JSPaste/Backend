import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { t } from 'elysia';
import { ServerEndpointVersion } from '../types/Server.ts';
import { JSPError } from '../classes/JSPError.ts';
import { Server } from '../classes/Server.ts';
import type { KeyRange } from '../types/Range.ts';

export class PublishV2 extends AbstractEndpoint {
	public constructor(server: Server) {
		super(server);
	}

	public override register(prefix: string): void {
		const hook = {
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
				// TODO: TypeBox should allow KeyRange...
				keyLength: t.Optional(
					t.Integer({
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
					t.Integer({
						description: `Number in seconds that the document will exist before it is automatically removed. Set to 0 to make the document permanent. If nothing is set, the default period is: ${Server.config.documents.maxTime}`,
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
							t.Integer({
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
				400: JSPError.schema
			},
			detail: { summary: 'Publish document', tags: ['v2'] }
		};

		this.server.getElysia.post(
			prefix,
			async ({ set, headers, query, body }) => {
				return this.server.getDocumentHandler.setContext(set).publish(
					{
						body: body,
						selectedKey: headers.key || '',
						selectedKeyLength:
							(headers.keyLength as KeyRange | undefined) || Server.config.documents.defaultKeyLength,
						selectedSecret: headers.secret || '',
						lifetime: headers.lifetime ?? Server.config.documents.maxTime,
						password: headers.password || query['password'] || ''
					},
					ServerEndpointVersion.v2
				);
			},
			hook
		);
	}
}
