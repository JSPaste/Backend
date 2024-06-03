import { OpenAPIHono } from '@hono/zod-openapi';
import { accessRoute } from './access.route.ts';
import { accessRawRoute } from './accessRaw.route.ts';
import { publishRoute } from './publish.route.ts';
import { removeRoute } from './remove.route.ts';

export const v1 = (): typeof endpoint => {
	const endpoint = new OpenAPIHono();

	endpoint.get('/', (ctx) => {
		return ctx.text('Welcome to JSPaste API v1');
	});

	accessRoute(endpoint);
	accessRawRoute(endpoint);
	publishRoute(endpoint);
	removeRoute(endpoint);

	return endpoint;
};
