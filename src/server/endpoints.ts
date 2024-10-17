import type { OpenAPIHono } from '@hono/zod-openapi';
import { v1 } from '@x-v1/index.ts';
import { v2 } from '@x-v2/index.ts';
import { config } from '../server.ts';

export const endpoints = (instance: OpenAPIHono): void => {
	instance.get('/documents/*', (ctx) => {
		return ctx.redirect(`${config.apiPath}/v2/documents`.concat(ctx.req.path.split('/documents').pop() ?? ''), 307);
	});

	instance.route('/v2/documents', v2());
	instance.route('/v1/documents', v1());
};
