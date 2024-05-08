import type { Hono } from 'hono';
import { ErrorHandler } from '../../classes/ErrorHandler.ts';
import { ErrorCode } from '../../types/ErrorHandler.ts';
import { CryptoUtils } from '../../utils/CryptoUtils.ts';
import { DocumentUtils } from '../../utils/DocumentUtils.ts';
import { MiddlewareUtils } from '../../utils/MiddlewareUtils.ts';

export const editRoute = (endpoint: Hono) => {
	endpoint.patch('/:name', MiddlewareUtils.bodyLimit(), async (ctx) => {
		const body = await ctx.req.arrayBuffer();
		const params = ctx.req.param();
		const headers = {
			secret: ctx.req.header('secret'),
			password: ctx.req.header('password')
		};

		const document = await DocumentUtils.documentReadV1(params.name);

		DocumentUtils.validateSecret(headers.secret, document.header.secretHash);

		if (document.header.passwordHash) {
			if (!headers.password) {
				throw ErrorHandler.send(ErrorCode.documentPasswordNeeded);
			}

			DocumentUtils.validatePassword(headers.password, document.header.passwordHash);
		}

		const data = Bun.deflateSync(body);

		document.data = headers.password ? CryptoUtils.encrypt(data, headers.password) : data;

		return ctx.json({
			edited: await DocumentUtils.documentWriteV1(params.name, document)
				.then(() => true)
				.catch(() => false)
		});
	});
};
