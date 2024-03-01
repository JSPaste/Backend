import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { t } from 'elysia';
import { ServerEndpointVersion } from '../types/Server.ts';
import { JSPError } from '../classes/JSPError.ts';
import { Server } from '../classes/Server.ts';

export class PublishV1 extends AbstractEndpoint {
	public constructor(server: Server) {
		super(server);
	}

	protected override run(): void {
		this.server.getElysia.post(
			this.prefix,
			async ({ set, body }) => {
				return this.server.getDocumentHandler
					.setContext(set)
					.setVersion(ServerEndpointVersion.v1)
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
						{ description: 'An object with a key and a secret for the document' }
					),
					400: JSPError.schema
				},
				detail: { summary: 'Publish document', tags: ['v1'] }
			}
		);
	}
}
