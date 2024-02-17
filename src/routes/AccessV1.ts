import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { type Elysia, t } from 'elysia';
import { DocumentHandler } from '../classes/DocumentHandler.ts';
import { ServerVersion } from '../types/Server.ts';
import { JSPError } from '../classes/JSPError.ts';

export class AccessV1 extends AbstractEndpoint {
	public constructor(server: Elysia) {
		super(server);
	}

	public override register(prefix: string): void {
		const hook = {
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
				400: JSPError.errorSchema,
				404: JSPError.errorSchema
			},
			detail: { summary: 'Get document', tags: ['v1'] }
		};

		this.server.get(
			prefix.concat('/:key'),
			async ({ set, params: { key } }) => DocumentHandler.handleAccess(set, { key: key }, ServerVersion.v1),
			hook
		);
	}
}
