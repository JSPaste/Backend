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

				if (headers.password) {
					DocumentUtils.validatePasswordLength(headers.password);
				}

				if (headers.secret) {
					DocumentUtils.validateSecretLength(headers.secret);
				}

				const secret = headers.secret || StringUtils.createSecret();

				if (headers.name) {
					await DocumentUtils.validateSelectedKey(headers.name);
				} else {
					DocumentUtils.validateSelectedKeyLength(headers.nameLength);
				}

				const name = headers.name || (await StringUtils.createKey(headers.nameLength));

				const data = Bun.deflateSync(body as ArrayBuffer);

				await DocumentUtils.documentWriteV1(Server.DOCUMENT_PATH + name, {
					data: headers.password ? CryptoUtils.encrypt(data, headers.password) : data,
					header: {
						name: name,
						secretHash: CryptoUtils.hash(secret) as string,
						dataHash: headers.password ? (CryptoUtils.hash(headers.password) as string) : null
					}
				});

				return {
					key: name,
					secret: secret,
					url: Server.HOSTNAME.concat('/', name),
					// Deprecated, for compatibility reasons will be kept to 0
					expirationTimestamp: 0
				};
			},
			{
				type: 'arrayBuffer',
				body: t.Any({
					description: 'The file to be uploaded',
					default: 'Hello, World!'
				}),
				headers: t.Object({
					name: t.Optional(
						t.String({
							description: 'A custom key, if null, a new key will be generated',
							examples: ['abc123']
						})
					),
					nameLength: t.Optional(
						t.Numeric({
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
