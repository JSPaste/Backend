import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';
import { DocumentUtils } from '../utils/DocumentUtils.ts';

export class AccessRawV1 extends AbstractEndpoint {
	protected override run(): void {
		this.SERVER.elysia.get(
			this.PREFIX.concat('/:name/raw'),
			async ({ set, params }) => {
				DocumentUtils.validateName(params.name);

				const file = await DocumentUtils.retrieveDocument(params.name);
				const document = await DocumentUtils.documentReadV1(file);

				// V1 Endpoint does not support Server-Side Encryption
				if (document.header.dataHash) {
					ErrorHandler.send(ErrorCode.documentPasswordNeeded);
				}

				const data = Bun.inflateSync(document.data);

				set.headers['Content-Type'] = 'text/plain;charset=utf-8';
				return data;
			},
			{
				params: t.Object(
					{
						name: t.String({
							description: 'The document name',
							examples: ['abc123']
						})
					},
					{
						description: 'The request parameters',
						examples: [{ key: 'abc123' }]
					}
				),
				response: {
					200: t.Any({
						description: 'The raw document',
						examples: ['Hello, World!']
					}),
					400: ErrorHandler.SCHEMA,
					404: ErrorHandler.SCHEMA
				},
				detail: {
					summary: 'Get raw document',
					tags: ['v1'],
					deprecated: true
				}
			}
		);
	}
}
