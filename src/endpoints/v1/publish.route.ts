import type { Hono } from 'hono';
import { CryptoUtils } from '../../utils/CryptoUtils.ts';
import { DocumentUtils } from '../../utils/DocumentUtils.ts';
import { MiddlewareUtils } from '../../utils/MiddlewareUtils.ts';
import { StringUtils } from '../../utils/StringUtils.ts';

import util from 'node:util';
import zlib from 'node:zlib';

const brotliCompress = util.promisify(zlib.brotliCompress);

export const publishRoute = (endpoint: Hono) => {
	endpoint.post('/', MiddlewareUtils.bodyLimit(), async (ctx) => {
		const body = await ctx.req.arrayBuffer();
		const name = await StringUtils.createName();
		const secret = StringUtils.createSecret();
		const data = await brotliCompress(body);

		await DocumentUtils.documentWriteV1(name, {
			data: data,
			header: {
				name: name,
				secretHash: CryptoUtils.hash(secret) as string,
				passwordHash: null
			}
		});

		return ctx.json({ key: name, secret: secret });
	});
};
