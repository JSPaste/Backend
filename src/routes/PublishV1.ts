import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { type Elysia, t } from 'elysia';
import { DocumentHandler } from '../classes/DocumentHandler.ts';
import { ServerVersion } from '../types/Server.ts';
import { JSPError } from '../classes/JSPError.ts';

export class PublishV1 extends AbstractEndpoint {
	public constructor(server: Elysia) {
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
				400: JSPError.errorSchema
			},
			detail: { summary: 'Publish document', tags: ['v1'] }
		};

		this.server.post(
			prefix,
			async ({ set, body }) => DocumentHandler.handlePublish(set, { body }, ServerVersion.v1),
			hook
		);
	}
}
