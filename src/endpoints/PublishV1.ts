import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { t } from 'elysia';
import { ServerVersion } from '../types/Server.ts';
import { Error } from '../classes/Error.ts';
import type { Server } from '../classes/Server.ts';

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
				400: Error.schema
			},
			detail: { summary: 'Publish document', tags: ['v1'] }
		};

		this.server.getElysia.post(
			prefix,
			async ({ set, body }) => {
				this.server.getDocumentHandler.setContext = set;
				return this.server.getDocumentHandler.publish({ body }, ServerVersion.v1);
			},
			hook
		);
	}
}
