import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { type Elysia, t } from 'elysia';
import { DocumentHandler } from '../classes/DocumentHandler.ts';
import { ServerVersion } from '../types/Server.ts';
import { genericErrorType } from '../utils/constants.ts';

export class AccessRawV1 extends AbstractEndpoint {
	public constructor(server: Elysia) {
		super(server);
	}

	public override register(prefix: string): void {
		const hook = {
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
				400: genericErrorType,
				404: genericErrorType
			},
			detail: {
				summary: 'Get raw document',
				tags: ['v1']
			}
		};

		this.server.get(
			prefix.concat('/:key/raw'),
			async ({ set, params: { key } }) => {
				set.headers['Content-Type'] = 'text/plain';

				return DocumentHandler.handleAccess(set, { key: key, raw: true }, ServerVersion.v1);
			},
			hook
		);
	}
}
