import type { Hono } from 'hono';
import { CryptoUtils } from '../../utils/CryptoUtils.ts';
import { DocumentUtils } from '../../utils/DocumentUtils.ts';
import { StringUtils } from '../../utils/StringUtils.ts';

export const publishRoute = (endpoint: Hono) => {
	endpoint.post('/', async (ctx) => {
		const body = await ctx.req.arrayBuffer();

		DocumentUtils.validateSizeBetweenLimits(body);

		const name = await StringUtils.createName();
		const secret = StringUtils.createSecret();

		const data = Bun.deflateSync(body);

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
