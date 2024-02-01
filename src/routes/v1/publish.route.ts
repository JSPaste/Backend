import { Elysia, t } from 'elysia';
import { ErrorSender } from '../../classes/ErrorSender';
import { DocumentHandler } from '../../classes/DocumentHandler.ts';
import { errorSenderPlugin } from '../../plugins/errorSender.ts';
import { APIVersions } from '../../utils/constants.ts';

export default new Elysia({
	name: 'routes:v1:documents:publish'
})
	.use(errorSenderPlugin)
	.post('', async ({ errorSender, body }) => DocumentHandler.handlePublish({ errorSender, body }, APIVersions.v1), {
		type: 'arrayBuffer',
		body: t.Any({ description: 'The file to be uploaded' }),
		response: {
			200: t.Object(
				{
					key: t.String({
						description: 'The generated key to access the document'
					}),
					secret: t.String({
						description: 'The generated secret to delete the document'
					})
				},
				{ description: 'An object with a key and a secret for the document' }
			),
			400: ErrorSender.errorType()
		},
		detail: { summary: 'Publish document', tags: ['v1'] }
	});
