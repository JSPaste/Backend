import { Elysia, t } from 'elysia';
import { createKey } from '../../util/createKey';
import { errorSenderPlugin } from '../../plugins/errorSender';

const basePath = process.env.DOCUMENTS_PATH;

export default new Elysia({
	name: 'routes:v1:documents:publish',
})
	.use(errorSenderPlugin)
	.post(
		'',
		async ({ body }) => {
			const selectedKey = await createKey();

			// TODO: Add secret key & send it

			await Bun.write(
				basePath + selectedKey,
				Bun.deflateSync(Buffer.from(body as ArrayBuffer)),
			);

			return { key: selectedKey };
		},
		{
			parse: ({ request }) => request.arrayBuffer(),
			body: t.Any(),
			response: t.Union([
				t.Object({
					key: t.String({
						description: 'The generated key to access the document',
					}),
				}),
			]),
			detail: { summary: 'Publish document', tags: ['v1'] },
		},
	);
