import type { Hono } from 'hono';
import { ErrorHandler } from '../../classes/ErrorHandler.ts';
import { Server } from '../../classes/Server.ts';
import { ErrorCode } from '../../types/ErrorHandler.ts';
import { CryptoUtils } from '../../utils/CryptoUtils.ts';
import { DocumentUtils } from '../../utils/DocumentUtils.ts';
import { StringUtils } from '../../utils/StringUtils.ts';

export const publishRoute = (endpoint: Hono) => {
	endpoint.post('/', async (ctx) => {
		const body = await ctx.req.arrayBuffer();

		const headers = {
			key: ctx.req.header('key'),
			keylength: Number(ctx.req.header('keylength')),
			password: ctx.req.header('password'),
			secret: ctx.req.header('secret')
		};

		DocumentUtils.validateSizeBetweenLimits(body);

		if (headers.password) {
			DocumentUtils.validatePasswordLength(headers.password);
		}

		let secret: string;

		if (headers.secret) {
			DocumentUtils.validateSecretLength(headers.secret);

			secret = headers.secret;
		} else {
			secret = StringUtils.createSecret();
		}

		let name: string;

		if (headers.key) {
			DocumentUtils.validateName(headers.key);

			if (await StringUtils.nameExists(headers.key)) {
				ErrorHandler.send(ErrorCode.documentNameAlreadyExists);
			}

			name = headers.key;
		} else {
			DocumentUtils.validateNameLength(headers.keylength);

			name = await StringUtils.createName(headers.keylength);
		}

		const data = Bun.deflateSync(body);

		await DocumentUtils.documentWriteV1(name, {
			data: headers.password ? CryptoUtils.encrypt(data, headers.password) : data,
			header: {
				name: name,
				secretHash: CryptoUtils.hash(secret) as string,
				passwordHash: headers.password ? (CryptoUtils.hash(headers.password) as string) : null
			}
		});

		return ctx.json({
			key: name,
			secret: secret,
			url: Server.HOSTNAME.concat('/', name),
			// Deprecated, for compatibility reasons will be kept to 0
			expirationTimestamp: 0
		});
	});
};
