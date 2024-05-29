import { brotliDecompressSync } from 'node:zlib';
import type { Hono } from '@hono/hono';
import { ErrorHandler } from '../../classes/ErrorHandler.ts';
import { ErrorCode } from '../../types/ErrorHandler.ts';
import { CryptoUtils } from '../../utils/CryptoUtils.ts';
import { DocumentUtils } from '../../utils/DocumentUtils.ts';

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

		const document = await DocumentUtils.documentReadV1(params.name);

		let data: Uint8Array;

		if (document.header.passwordHash) {
			if (!options.password) {
				throw ErrorHandler.send(ErrorCode.documentPasswordNeeded);
			}

			DocumentUtils.validatePassword(options.password, document.header.passwordHash);

			data = CryptoUtils.decrypt(document.data, options.password);
		} else {
			data = document.data;
		}

		ctx.header('Content-Type', 'text/plain;charset=utf-8');

		return ctx.body(brotliDecompressSync(data));
	});
};
