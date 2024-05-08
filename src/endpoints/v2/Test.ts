import type { Hono } from 'hono';

export const Test = (endpoint: Hono): void => {
	endpoint.get('/test', (ctx) => {
		ctx.status(200);

		return ctx.json({ test: true });
	});
};
