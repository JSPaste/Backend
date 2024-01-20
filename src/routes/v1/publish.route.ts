import { Elysia, t } from 'elysia';
import { ErrorSender } from '../../classes/ErrorSender';
import { DocumentHandler } from '../../classes/DocumentHandler.ts';

export default new Elysia({
	name: 'routes:v1:documents:publish'
}).post(
	'',
	async ({ body }) =>
		DocumentHandler.handlePublish({
			body
		}),
	{
		type: 'arrayBuffer',
		body: t.Any({ description: 'The file to be uploaded' }),
		response: {
			200: t.Object({
				key: t.String({
					description: 'The generated key to access the document'
				}),
				secret: t.String({
					description: 'The generated secret to delete the document'
				})
			}),
			400: ErrorSender.errorType()
		},
		detail: { summary: 'Publish document', tags: ['v1'] }
	}
);
