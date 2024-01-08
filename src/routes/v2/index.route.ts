import { Elysia } from 'elysia';

export default new Elysia({
	name: 'routes:v2:documents',
}).get('', () => {
	return 'Welcome to JSPaste API v2';
});
