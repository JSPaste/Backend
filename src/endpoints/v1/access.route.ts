import { brotliDecompressSync } from 'node:zlib';
import type { Hono } from '@hono/hono';
import { storage } from '../../document/storage.ts';
import { errorHandler } from '../../errorHandler.ts';
import { ErrorCode } from '../../types/ErrorHandler.ts';

export const accessRoute = (endpoint: Hono) => {
	endpoint.get('/:name', async (ctx) => {
		const params = ctx.req.param();

		const document = await storage.read(params.name);

		// V1 Endpoint does not support Server-Side Encryption
		if (document.header.passwordHash) {
			errorHandler.send(ErrorCode.documentPasswordNeeded);
		}

		return ctx.json({
			key: params.name,
			data: brotliDecompressSync(document.data).toString()
		});
	});
};
