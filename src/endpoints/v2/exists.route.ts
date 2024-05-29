import type { Hono } from 'hono';
import { validator } from '../../document/validator.ts';
import { config } from '../../server.ts';

export const existsRoute = (endpoint: Hono) => {
	endpoint.get('/:name/exists', async (ctx) => {
		const params = ctx.req.param();

		validator.validateName(params.name);

		return ctx.text(await Bun.file(config.SYSTEM_DOCUMENT_PATH + params.name).exists());
	});
};
