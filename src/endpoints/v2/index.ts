import { OpenAPIHono } from '@hono/zod-openapi';
import { accessRoute } from './access.route.ts';
import { accessRawRoute } from './accessRaw.route.ts';
import { editRoute } from './edit.route.ts';
import { existsRoute } from './exists.route.ts';
import { publishRoute } from './publish.route.ts';
import { removeRoute } from './remove.route.ts';

export const v2 = (): typeof endpoint => {
	const endpoint = new OpenAPIHono();

	endpoint.get('/', (ctx) => {
		return ctx.text('Welcome to JSPaste API v2');
	});

	accessRoute(endpoint);
	accessRawRoute(endpoint);
	editRoute(endpoint);
	existsRoute(endpoint);
	publishRoute(endpoint);
	removeRoute(endpoint);

	return endpoint;
};
