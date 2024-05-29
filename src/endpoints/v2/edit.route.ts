import { brotliCompressSync } from 'node:zlib';
import type { Hono } from 'hono';
import { crypto } from '../../document/crypto.ts';
import { storage } from '../../document/storage.ts';
import { validator } from '../../document/validator.ts';
import { errorHandler } from '../../errorHandler.ts';
import { middleware } from '../../middleware.ts';
import { ErrorCode } from '../../types/ErrorHandler.ts';

export const editRoute = (endpoint: Hono) => {
	endpoint.patch('/:name', middleware.bodyLimit(), async (ctx) => {
		const body = await ctx.req.arrayBuffer();
		const params = ctx.req.param();
		const headers = {
			secret: ctx.req.header('secret'),
			password: ctx.req.header('password')
		};

		const document = await storage.read(params.name);

		validator.validateSecret(headers.secret, document.header.secretHash);

		if (document.header.passwordHash) {
			if (!headers.password) {
				throw errorHandler.send(ErrorCode.documentPasswordNeeded);
			}

			validator.validatePassword(headers.password, document.header.passwordHash);
		}

		const data = brotliCompressSync(body);

		document.data = headers.password ? crypto.encrypt(data, headers.password) : data;

		return ctx.json({
			edited: await storage
				.write(params.name, document)
				.then(() => true)
				.catch(() => false)
		});
	});
};
