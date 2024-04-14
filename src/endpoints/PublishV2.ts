import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';
import { Server } from '../classes/Server.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';
import { CryptoUtils } from '../utils/CryptoUtils.ts';
import { DocumentUtils } from '../utils/DocumentUtils.ts';
import { StringUtils } from '../utils/StringUtils.ts';

export class PublishV2 extends AbstractEndpoint {
	protected override run(): void {
		this.SERVER.elysia.post(
			this.PREFIX,
			async ({ headers, body }) => {
				DocumentUtils.validateSelectedKey(headers.key);
				DocumentUtils.validateSelectedKeyLength(headers.keylength);
				DocumentUtils.validatePasswordLength(headers.password);

				const secret = headers.secret || StringUtils.createSecret();

				DocumentUtils.validateSecretLength(secret);
				DocumentUtils.validateSizeBetweenLimits(body);

				const bodyPack = Bun.deflateSync(body);
				const key = headers.key || (await StringUtils.createKey(headers.keylength));

				if (headers.key && (await StringUtils.keyExists(key))) {
					ErrorHandler.send(ErrorCode.documentKeyAlreadyExists);
				}

				await DocumentUtils.documentWrite(Server.DOCUMENT_PATH + key, {
					data: headers.password ? CryptoUtils.encrypt(bodyPack, headers.password) : bodyPack,
					header: {
						dataHash: headers.password ? CryptoUtils.hash(headers.password) : null,
						modHash: CryptoUtils.hash(secret),
						createdAt: Date.now()
					},
					version: 1
				});

				return {
					key,
					secret,
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
								description:
									'DEPRECATED! UNIX timestamp with the expiration date in milliseconds. Undefined if the document is permanent.'
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
