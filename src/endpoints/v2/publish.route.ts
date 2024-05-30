import { brotliCompressSync } from 'node:zlib';
import type { Hono } from 'hono';
import { crypto } from '../../document/crypto.ts';
import { storage } from '../../document/storage.ts';
import { validator } from '../../document/validator.ts';
import { errorHandler } from '../../errorHandler.ts';
import { middleware } from '../../middleware.ts';
import { config } from '../../server.ts';
import { ErrorCode } from '../../types/ErrorHandler.ts';
import { StringUtils } from '../../utils/StringUtils.ts';

export const publishRoute = (endpoint: Hono) => {
	endpoint.post('/', middleware.bodyLimit(), async (ctx) => {
		const body = await ctx.req.arrayBuffer();
		const headers = {
			key: ctx.req.header('key'),
			keylength: Number(ctx.req.header('keylength')),
			password: ctx.req.header('password'),
			secret: ctx.req.header('secret')
		};

		if (headers.password) {
			validator.validatePasswordLength(headers.password);
		}

		let secret: string;

		if (headers.secret) {
			validator.validateSecretLength(headers.secret);

			secret = headers.secret;
		} else {
			secret = StringUtils.createSecret();
		}

		let name: string;

		if (headers.key) {
			validator.validateName(headers.key);

			if (await StringUtils.nameExists(headers.key)) {
				errorHandler.send(ErrorCode.documentNameAlreadyExists);
			}

			name = headers.key;
		} else {
			validator.validateNameLength(headers.keylength);

			name = await StringUtils.createName(headers.keylength);
		}

		const data = brotliCompressSync(body);

		await storage.write(name, {
			data: headers.password ? crypto.encrypt(data, headers.password) : data,
			header: {
				name: name,
				secretHash: crypto.hash(secret) as string,
				passwordHash: headers.password ? (crypto.hash(headers.password) as string) : null
			}
		});

		return ctx.json({
			key: name,
			secret: secret,
			url: config.hostname.concat('/', name),
			// Deprecated, for compatibility reasons will be kept to 0
			expirationTimestamp: 0
		});
	});
};
