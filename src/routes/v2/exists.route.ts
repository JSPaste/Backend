import { Elysia, t } from 'elysia';
import { ErrorSender } from '../../classes/ErrorSender.ts';
import { DocumentHandler } from '../../classes/DocumentHandler.ts';
import { errorSenderPlugin } from '../../plugins/errorSender.ts';

export default new Elysia({
	name: 'routes:v2:documents:exists'
})
	.use(errorSenderPlugin)
	.get(
		':key/exists',
		async ({ errorSender, params: { key } }) =>
			DocumentHandler.handleExists({ errorSender, key: key }),
		{
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
		}
	);
