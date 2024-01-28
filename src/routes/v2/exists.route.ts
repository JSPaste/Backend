import { Elysia, t } from 'elysia';
import { ErrorSender } from '../../classes/ErrorSender.ts';
import { DocumentHandler } from '../../classes/DocumentHandler.ts';
import { errorSenderPlugin } from '../../plugins/errorSender.ts';

export default new Elysia({
	name: 'routes:v2:documents:exits'
})
	.use(errorSenderPlugin)
	.get(
		':id/exists',
		async ({ errorSender, params: { id } }) =>
			DocumentHandler.handleExists({ errorSender, id }),
		{
			params: t.Object({
				id: t.String({
					description: 'The document ID',
					examples: ['abc123']
				})
			}),
			response: {
				200: t.Boolean({ description: 'A boolean indicating if the document exists' }),
				400: ErrorSender.errorType()
			},

			detail: { summary: 'Check document by ID', tags: ['v2'] }
		}
	);
