import { Elysia, t } from 'elysia';

export const documentPublishRoute = new Elysia({
	name: 'routes:documents:publish',
	prefix: '/documents',
}).post(
	'/',
	({ body }) => {
		return body;
	},
	{
		body: t.Any(),
	},
);
