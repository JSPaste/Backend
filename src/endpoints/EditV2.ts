import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';
import { CryptoUtils } from '../utils/CryptoUtils.ts';
import { DocumentUtils } from '../utils/DocumentUtils.ts';

export class EditV2 extends AbstractEndpoint {
	protected override run(): void {
		this.SERVER.elysia.patch(
			this.PREFIX.concat('/:name'),
			async ({ headers, body, params }) => {
				DocumentUtils.validateSizeBetweenLimits(body);

				const document = await DocumentUtils.documentReadV1(params.name);

				DocumentUtils.validateSecret(headers.secret, document.header.secretHash);

				if (document.header.passwordHash) {
					if (!headers.password) {
						throw ErrorHandler.send(ErrorCode.documentPasswordNeeded);
					}

					DocumentUtils.validatePassword(headers.password, document.header.passwordHash);
				}

				const data = Bun.deflateSync(body as ArrayBuffer);

				document.data = headers.password ? CryptoUtils.encrypt(data, headers.password) : data;

				return {
					edited: await DocumentUtils.documentWriteV1(params.name, document)
						.then(() => true)
						.catch(() => false)
				};
			},
			{
				type: 'arrayBuffer',
				body: t.Any({ description: 'The new file', default: 'Hello, World!' }),
				params: t.Object({
					name: t.String({
						description: 'The document name',
						examples: ['abc123']
					})
				}),
				headers: t.Object({
					secret: t.String({
						description: 'The document secret',
						examples: ['aaaaa-bbbbb-ccccc-ddddd']
					}),
					password: t.Optional(
						t.String({
							description: 'The document password if aplicable',
							examples: ['abc123']
						})
					)
				}),
				response: {
					200: t.Object(
						{
							edited: t.Boolean({
								description: 'A boolean indicating if the edit was successful'
							})
						},
						{ description: 'A response object with a boolean' }
					),
					400: ErrorHandler.SCHEMA,
					403: ErrorHandler.SCHEMA,
					404: ErrorHandler.SCHEMA
				},
				detail: { summary: 'Edit document', tags: ['v2'] }
			}
		);
	}
}
