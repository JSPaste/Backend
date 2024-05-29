import { brotliDecompressSync } from 'node:zlib';
import type { Hono } from 'hono';
import { crypto } from '../../document/crypto.ts';
import { storage } from '../../document/storage.ts';
import { validator } from '../../document/validator.ts';
import { errorHandler } from '../../errorHandler.ts';
import { config } from '../../server.ts';
import { ErrorCode } from '../../types/ErrorHandler.ts';

export const accessRoute = (endpoint: Hono) => {
	endpoint.get('/:name', async (ctx) => {
		const params = ctx.req.param();

		const headers = {
			password: ctx.req.header('password')
		};

		const document = await storage.read(params.name);

		let data: Uint8Array;

		if (document.header.passwordHash) {
			if (!headers.password) {
				throw errorHandler.send(ErrorCode.documentPasswordNeeded);
			}

			validator.validatePassword(headers.password, document.header.passwordHash);
			data = crypto.decrypt(document.data, headers.password);
		} else {
			data = document.data;
		}

		return ctx.json({
			key: params.name,
			data: brotliDecompressSync(data).toString(),
			url: config.HOSTNAME.concat('/', params.name),
			// Deprecated, for compatibility reasons will be kept to 0
			expirationTimestamp: 0
		});
	});
};
