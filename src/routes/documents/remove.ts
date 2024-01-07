import { Elysia, t } from 'elysia';

export const documentRemoveRoute = new Elysia({
	name: 'routes:documents:remove',
	prefix: '/documents',
}).delete(
	'/',
	({ params: { id } }) => {
		return id;
	},
	{ params: t.Object({ id: t.String() }) },
);
