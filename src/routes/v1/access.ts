import { Elysia, t } from 'elysia';

export const documentAccessRoute = new Elysia({
	name: 'routes:v1:documents:access',
	prefix: '/',
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
		({ params: { id } }) => {
			return id;
		},
		{ params: t.Object({ id: t.String() }) },
	);
