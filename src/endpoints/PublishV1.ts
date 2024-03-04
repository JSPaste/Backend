import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { MessageHandler } from '../classes/MessageHandler.ts';
import { ServerEndpointVersion } from '../types/Server.ts';

export class PublishV1 extends AbstractEndpoint {
	protected override run(): void {
		this.server.getElysia.post(
			this.prefix,
			async ({ body }) => {
				return this.server.getDocumentHandler.setVersion(ServerEndpointVersion.v1).publish({ body });
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
					400: MessageHandler.schema
				},
				detail: { summary: 'Publish document', tags: ['v1'] }
			}
		);
	}
}
