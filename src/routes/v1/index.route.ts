import { Elysia } from 'elysia';

export default new Elysia({
	name: 'routes:v1:documents',
}).get('', () => {
	return 'Welcome to JSPaste API v1';
});
