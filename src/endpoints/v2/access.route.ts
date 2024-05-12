import { brotliDecompressSync } from 'node:zlib';
import type { Hono } from 'hono';
import { ErrorHandler } from '../../classes/ErrorHandler.ts';
import { Server } from '../../classes/Server.ts';
import { ErrorCode } from '../../types/ErrorHandler.ts';
import { CryptoUtils } from '../../utils/CryptoUtils.ts';
import { DocumentUtils } from '../../utils/DocumentUtils.ts';

export const accessRoute = (endpoint: Hono) => {
	endpoint.get('/:name', async (ctx) => {
		const params = ctx.req.param();

		const headers = {
			password: ctx.req.header('password')
		};

		const document = await DocumentUtils.documentReadV1(params.name);

		let data: Uint8Array;

		if (document.header.passwordHash) {
			if (!headers.password) {
				throw ErrorHandler.send(ErrorCode.documentPasswordNeeded);
			}

			DocumentUtils.validatePassword(headers.password, document.header.passwordHash);
			data = CryptoUtils.decrypt(document.data, headers.password);
		} else {
			data = document.data;
		}

		return ctx.json({
			key: params.name,
			data: brotliDecompressSync(data).toString(),
			url: Server.HOSTNAME.concat('/', params.name),
			// Deprecated, for compatibility reasons will be kept to 0
			expirationTimestamp: 0
		});
	});
};
