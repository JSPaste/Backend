import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';
import { Server } from '../classes/Server.ts';
import { CryptoUtils } from '../utils/CryptoUtils.ts';
import { DocumentUtils } from '../utils/DocumentUtils.ts';
import { StringUtils } from '../utils/StringUtils.ts';

export class PublishV2 extends AbstractEndpoint {
	protected override run(): void {
		this.SERVER.elysia.post(
			this.PREFIX,
			async ({ headers, body }) => {
				DocumentUtils.validateSizeBetweenLimits(body);

				if (headers.secret) {
					DocumentUtils.validateSecretLength(headers.secret);
				}

				const secret = headers.secret || StringUtils.createSecret();

				if (headers.key) {
					await DocumentUtils.validateSelectedKey(headers.key);
				}

				DocumentUtils.validateSelectedKeyLength(headers.keylength);

				const key = headers.key || (await StringUtils.createKey(headers.keylength));
				const data = Bun.deflateSync(body);

				await DocumentUtils.documentWriteV1(Server.DOCUMENT_PATH + key, {
					data: headers.secret ? CryptoUtils.encrypt(data, secret) : data,
					header: {
						secretHash: CryptoUtils.hash(secret),
						sse: !!headers.secret,
						createdAt: Date.now()
					}
				});

				return {
					key: key,
					secret: secret,
					url: Server.HOSTNAME.concat('/', key),
					// Deprecated, for compatibility reasons will be kept to 0
					expirationTimestamp: 0
				};
			},
			{
				type: 'text',
				body: t.String({
					description: 'The file to be uploaded',
					default: 'Hello, World!'
				}),
				headers: t.Object({
					key: t.Optional(
						t.String({
							description: 'A custom key, if null, a new key will be generated',
							examples: ['abc123']
						})
					),
					keylength: t.Optional(
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
							description:
								'A custom password for the document, if null, anyone who has the key will be able to see the content of the document',
							examples: ['aaaaa-bbbbb-ccccc-ddddd']
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
							url: t.String({
								description: 'The URL for viewing the document on the web',
								examples: ['https://jspaste.eu/abc123']
							}),
							expirationTimestamp: t.Numeric({
								description: 'DEPRECATED! UNIX timestamp with the expiration date in milliseconds.'
							})
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
