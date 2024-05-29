import { brotliCompressSync } from 'node:zlib';
import type { Hono } from '@hono/hono';
import { crypto } from '../../document/crypto.ts';
import { storage } from '../../document/storage.ts';
import { middleware } from '../../middleware.ts';
import { StringUtils } from '../../utils/StringUtils.ts';

export const publishRoute = (endpoint: Hono) => {
	endpoint.post('/', middleware.bodyLimit(), async (ctx) => {
		const body = await ctx.req.arrayBuffer();
		const name = await StringUtils.createName();
		const secret = StringUtils.createSecret();

		await storage.write(name, {
			data: brotliCompressSync(body),
			header: {
				name: name,
				secretHash: crypto.hash(secret) as string,
				passwordHash: null
			}
		});

		return ctx.json({ key: name, secret: secret });
	});
};
