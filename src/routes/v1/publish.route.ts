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
		async ({ set, body: buffer }) => {
			const selectedKey = await createKey();

			await Bun.write(
				basePath + selectedKey,
				Bun.deflateSync(Buffer.from(buffer as ArrayBuffer)),
			);

			return { key: selectedKey };
		},
		{
			parse: ({ request }) => request.arrayBuffer(),
			body: t.Any(),
		},
	);
