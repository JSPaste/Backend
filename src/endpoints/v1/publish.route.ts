import type { Hono } from 'hono';
import { CompressorUtils } from '../../utils/CompressorUtils.ts';
import { CryptoUtils } from '../../utils/CryptoUtils.ts';
import { DocumentUtils } from '../../utils/DocumentUtils.ts';
import { MiddlewareUtils } from '../../utils/MiddlewareUtils.ts';
import { StringUtils } from '../../utils/StringUtils.ts';

export const publishRoute = (endpoint: Hono) => {
	endpoint.post('/', MiddlewareUtils.bodyLimit(), async (ctx) => {
		const body = await ctx.req.arrayBuffer();
		const name = await StringUtils.createName();
		const secret = StringUtils.createSecret();
		const data = await CompressorUtils.compress(body);

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
