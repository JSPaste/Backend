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
				DocumentUtils.validateSizeBetweenLimits(body);

				if (headers.password) {
					DocumentUtils.validatePasswordLength(headers.password);
				}

				let secret: string;

				if (headers.secret) {
					DocumentUtils.validateSecretLength(headers.secret);

					secret = headers.secret;
				} else {
					secret = StringUtils.createSecret();
				}

				let name: string;

				if (headers.name) {
					DocumentUtils.validateName(headers.name);

					if (await StringUtils.nameExists(headers.name)) {
						ErrorHandler.send(ErrorCode.documentNameAlreadyExists);
					}

					name = headers.name;
				} else {
					DocumentUtils.validateNameLength(headers.nameLength);

					name = await StringUtils.createName(headers.nameLength);
				}

				const data = Bun.deflateSync(body as ArrayBuffer);

				await DocumentUtils.documentWriteV1(name, {
					data: headers.password ? CryptoUtils.encrypt(data, headers.password) : data,
					header: {
						name: name,
						secretHash: CryptoUtils.hash(secret) as string,
						passwordHash: headers.password ? (CryptoUtils.hash(headers.password) as string) : null
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
							description: 'A custom name, if null, a new name will be generated',
							examples: ['abc123']
						})
					),
					nameLength: t.Optional(
						t.Numeric({
							description:
								'If a custom name is not set, this will determine the name length of the automatically generated name',
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
								'A custom password for the document, if null, anyone who has the name will be able to see the content of the document',
							examples: ['abc123']
						})
					)
				}),
				response: {
					200: t.Object(
						{
							key: t.String({
								description: 'The generated name to access the document',
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
								'An object with a name, a secret, the display URL and an expiration timestamp for the document'
						}
					),
					400: ErrorHandler.SCHEMA
				},
				detail: { summary: 'Publish document', tags: ['v2'] }
			}
		);
	}
}
