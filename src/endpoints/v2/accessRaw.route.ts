import { brotliDecompressSync } from 'node:zlib';
import type { Hono } from 'hono';
import { crypto } from '../../document/crypto.ts';
import { storage } from '../../document/storage.ts';
import { validator } from '../../document/validator.ts';
import { errorHandler } from '../../errorHandler.ts';
import { ErrorCode } from '../../types/ErrorHandler.ts';

export const accessRawRoute = (endpoint: Hono) => {
	endpoint.get('/:name/raw', async (ctx) => {
		const params = ctx.req.param();

		const headers = {
			password: ctx.req.header('password')
		};

		const query = {
			p: ctx.req.query('p')
		};

		const options = {
			password: headers.password || query.p
		};

		const document = await storage.read(params.name);

		let data: Uint8Array;

		if (document.header.passwordHash) {
			if (!options.password) {
				throw errorHandler.send(ErrorCode.documentPasswordNeeded);
			}

			validator.validatePassword(options.password, document.header.passwordHash);

			data = crypto.decrypt(document.data, options.password);
		} else {
			data = document.data;
		}

		ctx.header('Content-Type', 'text/plain;charset=utf-8');

		return ctx.body(brotliDecompressSync(data));
	});
};
