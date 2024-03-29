import { t } from 'elysia';
import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { DocumentHandler } from '../classes/DocumentHandler.ts';
import { ErrorHandler } from '../classes/ErrorHandler.ts';

export class AccessRawV1 extends AbstractEndpoint {
	protected override run(): void {
		// FIXME: Implicit "any" type on "set" & "params", careful...
		this.SERVER.elysia.get(
			this.PREFIX.concat('/:key/raw'),
			async ({ set, params }) => {
				set.headers['Content-Type'] = 'text/plain;charset=utf-8';

				return DocumentHandler.accessRaw({ key: params.key });
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
					400: ErrorHandler.SCHEMA,
					404: ErrorHandler.SCHEMA
				},
				detail: {
					summary: 'Get raw document',
					tags: ['v1']
				}
			}
		);
	}
}
