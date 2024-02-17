import { AbstractEndpoint } from '../classes/AbstractEndpoint.ts';
import { type Elysia, t } from 'elysia';
import { DocumentHandler } from '../classes/DocumentHandler.ts';
import { genericErrorType } from '../utils/constants.ts';

export class ExistsV2 extends AbstractEndpoint {
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
				200: t.Boolean({ description: 'A boolean indicating if the document exists' }),
				400: genericErrorType
			},
			detail: { summary: 'Check document', tags: ['v2'] }
		};

		this.server.get(
			prefix.concat('/:key/exists'),
			async ({ set, params: { key } }) => DocumentHandler.handleExists(set, { key: key }),
			hook
		);
	}
}
