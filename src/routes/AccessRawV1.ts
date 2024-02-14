import { RouteHandler } from '../classes/RouteHandler.ts';
import { type Elysia, t } from 'elysia';
import { DocumentHandler } from '../classes/DocumentHandler.ts';
import { ServerVersion } from '../utils/constants.ts';
import { ErrorSender } from '../classes/ErrorSender.ts';

export class AccessRawV1 extends RouteHandler {
	public constructor(server: Elysia) {
		super(server);
	}

	public override register(path: string): Elysia {
		return this.server.get(
			path.concat('/:key/raw'),
			async ({ errorSender, set, params: { key } }) => {
				set.headers['Content-Type'] = 'text/plain';

				return DocumentHandler.handleAccess({ errorSender, key: key, raw: true }, ServerVersion.v1);
			},
			{
				params: t.Object(
					{
						key: t.String({
							description: 'The document key',
							examples: ['abc123']
						})
					},
					{
						description: 'The request parameters',
						examples: [{ key: 'abc123' }]
					}
				),
				response: {
					200: t.Any({
						description: 'The raw document',
						examples: ['Hello world']
					}),
					400: ErrorSender.errorType(),
					404: ErrorSender.errorType()
				},
				detail: {
					summary: 'Get raw document',
					tags: ['v1']
				}
			}
		);
	}
}
