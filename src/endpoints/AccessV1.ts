import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';
import { ServerEndpointVersion } from '../types/Server.ts';

export class AccessV1 extends AbstractEndpoint {
	protected override run(): void {
		this.server.getElysia.get(
			this.prefix.concat('/:key'),
			async ({ params, error }) => {
				return this.server.getDocumentHandler
					.setVersion(ServerEndpointVersion.v1)
					.setError(error)
					.access({ key: params.key });
			},
			{
				params: t.Object({
					key: t.String({
						description: 'The document key',
						examples: ['abc123']
					})
				}),
				response: {
					200: t.Object(
						{
							key: t.String({
								description: 'The key of the document',
								examples: ['abc123']
							}),
							data: t.String({
								description: 'The document',
								examples: ['Hello world']
							})
						},
						{ description: 'The document object' }
					),
					400: ErrorHandler.schema,
					404: ErrorHandler.schema
				},
				detail: { summary: 'Get document', tags: ['v1'] }
			}
		);
	}
}
