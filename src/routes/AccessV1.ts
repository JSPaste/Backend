import { AbstractRoute } from '../classes/AbstractRoute.ts';
import { type Elysia, t } from 'elysia';
import { DocumentHandler } from '../classes/DocumentHandler.ts';
import { ServerVersion } from '../utils/constants.ts';
import { ErrorSender } from '../classes/ErrorSender.ts';

export class AccessV1 extends AbstractRoute {
	public constructor(server: Elysia) {
		super(server);
	}

	public override register(path: string): void {
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
				400: ErrorSender.errorType(),
				404: ErrorSender.errorType()
			},
			detail: { summary: 'Get document', tags: ['v1'] }
		};

		this.server.get(
			path.concat('/:key'),
			async ({ errorSender, params: { key } }) =>
				DocumentHandler.handleAccess({ errorSender, key: key }, ServerVersion.v1),
			hook
		);
	}
}
