import type { Hono } from '@hono/hono';
import { config } from '../../server.ts';
import { DocumentUtils } from '../../utils/DocumentUtils.ts';

export const existsRoute = (endpoint: Hono) => {
	endpoint.get('/:name/exists', async (ctx) => {
		const params = ctx.req.param();

		DocumentUtils.validateName(params.name);

		return ctx.text(await Bun.file(config.SYSTEM_DOCUMENT_PATH + params.name).exists());
	});
};
