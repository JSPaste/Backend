import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';
import { DocumentUtils } from '../utils/DocumentUtils.ts';

export class AccessV1 extends AbstractEndpoint {
	protected override run(): void {
		this.SERVER.elysia.get(
			this.PREFIX.concat('/:name'),
			async ({ params }) => {
				const document = await DocumentUtils.documentReadV1(params.name);

				// V1 Endpoint does not support Server-Side Encryption
				if (document.header.dataHash) {
					ErrorHandler.send(ErrorCode.documentPasswordNeeded);
				}

				const data = Buffer.from(Bun.inflateSync(document.data)).toString();

				return { key: params.name, data: data };
			},
			{
				params: t.Object({
					name: t.String({
						description: 'The document name',
						examples: ['abc123']
					})
				}),
				response: {
					200: t.Object(
						{
							key: t.String({
								description: 'The name of the document',
								examples: ['abc123']
							}),
							data: t.String({
								description: 'The document',
								examples: ['Hello, World!']
							})
						},
						{ description: 'The document object' }
					),
					400: ErrorHandler.SCHEMA,
					404: ErrorHandler.SCHEMA
				},
				detail: { summary: 'Get document', tags: ['v1'], deprecated: true }
			}
		);
	}
}
