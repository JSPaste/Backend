import type { Hono } from 'hono';
import { Server } from '../../classes/Server.ts';
import { DocumentUtils } from '../../utils/DocumentUtils.ts';

export const existsRoute = (endpoint: Hono) => {
	endpoint.get('/:name/exists', async (ctx) => {
		const params = ctx.req.param();

		DocumentUtils.validateName(params.name);

		return ctx.text(await Bun.file(Server.DOCUMENT_PATH + params.name).exists());
	});
};
