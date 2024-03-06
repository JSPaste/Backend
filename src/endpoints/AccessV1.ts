import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { MessageHandler } from '../classes/MessageHandler.ts';
import { ServerEndpointVersion } from '../types/Server.ts';

export class AccessV1 extends AbstractEndpoint {
	protected override run(): void {
		this.setHeader({ 'X-Test1': '1' }).setHeader({ 'X-Test2': '2' });

		this.server.getElysia.get(
			this.prefix.concat('/:key'),
			async ({ params, set }) => {
				for (const header of this.headers) set.headers = { ...set.headers, ...header };
				return this.server.getDocumentHandler.setVersion(ServerEndpointVersion.v1).access({ key: params.key });
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
					400: MessageHandler.schema,
					404: MessageHandler.schema
				},
				detail: { summary: 'Get document', tags: ['v1'] }
			}
		);
	}
}
