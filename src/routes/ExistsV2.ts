import { AbstractRoute } from '../classes/AbstractRoute.ts';
import { type Elysia, t } from 'elysia';
import { ErrorSender } from '../classes/ErrorSender.ts';
import { DocumentHandler } from '../classes/DocumentHandler.ts';

export class ExistsV2 extends AbstractRoute {
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
				200: t.Boolean({ description: 'A boolean indicating if the document exists' }),
				400: ErrorSender.errorType()
			},
			detail: { summary: 'Check document', tags: ['v2'] }
		};

		this.server.get(
			path.concat('/:key/exists'),
			async ({ errorSender, params: { key } }) => DocumentHandler.handleExists({ errorSender, key: key }),
			hook
		);
	}
}
