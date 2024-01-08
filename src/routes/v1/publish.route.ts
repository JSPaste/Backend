import { Elysia, t } from 'elysia';

export const documentPublishRoute = new Elysia({
	name: 'routes:v1:documents:publish',
	prefix: '/',
}).post(
	'',
	({ body }) => {
		return body;
	},
	{
		body: t.Any(),
	},
);
