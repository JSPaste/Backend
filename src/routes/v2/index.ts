import { Elysia } from 'elysia';

export const documentIndexRoute = new Elysia({
	name: 'routes:v2:documents',
	prefix: '/',
}).post('/', () => {
	return 'Welcome to JSPaste API v2';
});
