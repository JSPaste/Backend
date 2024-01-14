import { Elysia, t } from 'elysia';

export default new Elysia({
	name: 'routes:v2:documents'
}).get(
	'',
	() => {
		return 'Welcome to JSPaste API v2';
	},
	{
		response: t.String({
			description: 'A small welcome message with the current API version',
			examples: ['Welcome to JSPaste API v2']
		}),
		detail: { summary: 'Index', tags: ['v2'] }
	}
);
