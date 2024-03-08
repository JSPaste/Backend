import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';
import { ServerEndpointVersion } from '../types/Server.ts';

export class PublishV1 extends AbstractEndpoint {
	protected override run(): void {
		this.server.getElysia.post(
			this.prefix,
			async ({ body, error }) => {
				return this.server.getDocumentHandler
					.setVersion(ServerEndpointVersion.v1)
					.setError(error)
					.publish({ body });
			},
			{
				type: 'arrayBuffer',
				body: t.Any({ description: 'The file to be uploaded' }),
				response: {
					200: t.Object(
						{
							key: t.String({
								description: 'The generated key to access the document'
							}),
							secret: t.String({
								description: 'The generated secret to delete the document'
							})
						},
						{
							description: 'An object with a key and a secret for the document'
						}
					),
					400: ErrorHandler.schema
				},
				detail: { summary: 'Publish document', tags: ['v1'] }
			}
		);
	}
}
