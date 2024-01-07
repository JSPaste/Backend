import { Elysia } from 'elysia';

export const indexRoute = new Elysia({
	name: 'routes:index',
	prefix: '/'
}).get('/', () => {
	return 'test';
});
