import type { OpenAPIHono } from '@hono/zod-openapi';
import { v1 } from '../endpoints/v1';
import { v2 } from '../endpoints/v2';
import { config } from '../server.ts';

export const endpoints = (instance: OpenAPIHono): void => {
	instance.route('/v1/documents', v1());
	instance.route('/v2/documents', v2());

	// FIXME: Internal redirect?
	instance.get('/documents/*', (ctx) => {
		return ctx.redirect(`${config.apiPath}/v2/documents`.concat(ctx.req.path.split('/documents').pop() ?? ''), 302);
	});
};
