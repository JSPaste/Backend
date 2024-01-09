import { Elysia, t } from 'elysia';

const basePath = process.env.DOCUMENTS_PATH;

export default new Elysia({
	name: 'routes:v1:documents:access',
})
	.get(
		':id',
		({ params: { id } }) => {
			return {
				key: id,
				data: 'cl',
			};
		},
		{ params: t.Object({ id: t.String() }) },
	)
	.get(
		':id/raw',
		({ set, params: { id } }) => {
			return id;
		},
		{ params: t.Object({ id: t.String() }) },
	);
