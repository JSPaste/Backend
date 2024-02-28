import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { t } from 'elysia';
import { ServerEndpointVersion } from '../types/Server.ts';
import { JSPError } from '../classes/JSPError.ts';
import { Server } from '../classes/Server.ts';

export class PublishV1 extends AbstractEndpoint {
	public constructor(server: Server) {
		super(server);
	}

	public override register(prefix: string): void {
		const hook = {
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
		};

		this.server.getElysia.post(
			prefix,
			async ({ set, body }) => {
				return this.server.getDocumentHandler.setContext(set).publish(
					{
						lifetime: 0,
						password: '',
						selectedKey: '',
						selectedKeyLength: Server.config.documents.defaultKeyLength,
						selectedSecret: '',
						body
					},
					ServerEndpointVersion.v1
				);
			},
			hook
		);
	}
}
