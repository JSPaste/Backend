import { Elysia, t } from 'elysia';

export default new Elysia({
	name: 'routes:v1:documents:publish',
}).post(
	'',
	({ body }) => {
		return body;
	},
	{
		body: t.Any(),
	},
);
