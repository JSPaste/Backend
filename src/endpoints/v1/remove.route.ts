import { unlink } from 'node:fs/promises';
import type { Hono } from '@hono/hono';
import { storage } from '../../document/storage.ts';
import { validator } from '../../document/validator.ts';
import { config } from '../../server.ts';

export const removeRoute = (endpoint: Hono) => {
	endpoint.delete('/:name', async (ctx) => {
		const params = ctx.req.param();

		const headers = {
			secret: ctx.req.header('secret')
		};

		const document = await storage.read(params.name);

		validator.validateSecret(headers.secret, document.header.secretHash);

		return ctx.json({
			removed: await unlink(config.SYSTEM_DOCUMENT_PATH + params.name)
				.then(() => true)
				.catch(() => false)
		});
	});
};
