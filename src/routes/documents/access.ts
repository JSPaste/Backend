import { Elysia, t } from 'elysia';

export const documentAccessRoute = new Elysia({
	name: 'routes:documents:access',
	prefix: '/documents',
})
	.get(
		'/:id',
		({ params: { id } }) => {
			return {
				key: id,
				data: '',
			};
		},
		{ params: t.Object({ id: t.String() }) },
	)
	.get(
		'/:id/raw',
		({ params: { id } }) => {
			return id
		},
		{ params: t.Object({ id: t.String() }) },
	);
