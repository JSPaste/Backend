import { Elysia, t } from 'elysia';

export default new Elysia({
	name: 'routes:v1:documents:remove',
}).delete(
	'',
	({ params: { id } }) => {
		return id;
	},
	{ params: t.Object({ id: t.String({ description: 'The document ID.' }) }) },
);
