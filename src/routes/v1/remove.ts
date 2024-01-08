import { Elysia, t } from 'elysia';

export const documentRemoveRoute = new Elysia({
	name: 'routes:v1:documents:remove',
	prefix: '/',
}).delete(
	'',
	({ params: { id } }) => {
		return id;
	},
	{ params: t.Object({ id: t.String() }) },
);
