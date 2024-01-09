import { Elysia, t } from 'elysia';

export default new Elysia({
	name: 'routes:v1:documents',
}).get(
	'',
	() => {
		return 'Welcome to JSPaste API v1';
	},
	{
		response: t.String({
			description: 'A small welcome with the current API version.',
		}),
	},
);
