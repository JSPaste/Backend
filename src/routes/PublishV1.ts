import { AbstractRoute } from '../classes/AbstractRoute.ts';
import { type Elysia, t } from 'elysia';
import { DocumentHandler } from '../classes/DocumentHandler.ts';
import { ErrorSender } from '../classes/ErrorSender.ts';
import { ServerVersion } from '../utils/constants.ts';

export class PublishV1 extends AbstractRoute {
	public constructor(server: Elysia) {
		super(server);
	}

	public override register(path: string): Elysia {
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
				400: ErrorSender.errorType()
			},
			detail: { summary: 'Publish document', tags: ['v1'] }
		};

		return this.server.post(
			path,
			async ({ errorSender, body }) => DocumentHandler.handlePublish({ errorSender, body }, ServerVersion.v1),
			hook
		);
	}
}
