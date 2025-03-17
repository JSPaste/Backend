import type { OpenAPIHono } from '@hono/zod-openapi';
import { v1 } from '#v1/index.ts';
import { v2 } from '#v2/index.ts';
import { config } from '../config.ts';

export const endpoints = (instance: OpenAPIHono): void => {
	instance.get('/documents/*', (ctx) => {
		return ctx.redirect(`${config.apiPath}/v2/documents`.concat(ctx.req.path.split('/documents').pop() ?? ''), 307);
	});

	instance.route('/v2/documents', v2());
	instance.route('/v1/documents', v1());
};
