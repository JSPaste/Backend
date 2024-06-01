import { type OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { compression } from '../../document/compression.ts';
import { crypto } from '../../document/crypto.ts';
import { storage } from '../../document/storage.ts';
import { validator } from '../../document/validator.ts';
import { errorHandler, schema } from '../../errorHandler.ts';
import { config } from '../../server.ts';
import { ErrorCode } from '../../types/ErrorHandler.ts';

export const accessRoute = (endpoint: OpenAPIHono): void => {
	const route = createRoute({
		method: 'get',
		path: '/{name}',
		tags: ['v2'],
		summary: 'Get document',
		request: {
			params: z.object({
				name: z
					.string()
					.min(config.documentNameLengthMin)
					.max(config.documentNameLengthMax)
					.openapi({
						description: 'The document name',
						examples: ['abc123']
					})
			}),
			headers: z.object({
				password: z.string().optional().openapi({
					description: 'The password to decrypt the document'
				})
			})
		},
		responses: {
			200: {
				content: {
					'application/json': {
						schema: z.object({
							key: z.string({ description: 'The document name (formerly key)' }).openapi({
								example: 'abc123'
							}),
							data: z.string({ description: 'The document data' }).openapi({
								example: 'Hello, World!'
							}),
							url: z.string({ description: 'The document URL' }).openapi({
								example: 'https://example.test/abc123'
							}),
							expirationTimestamp: z
								.number({ description: 'The document expiration timestamp' })
								.openapi({
									deprecated: true,
									example: 0
								})
						})
					}
				},
				description: 'The document'
			},
			400: schema,
			404: schema,
			500: schema
		}
	});

	endpoint.openapi(route, async (ctx) => {
		const params = ctx.req.valid('param');
		const headers = ctx.req.valid('header');

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

		const buffer = await compression.decode(data);

		return ctx.json({
			key: params.name,
			data: buffer.toString('binary'),
			url: config.hostname.concat('/', params.name),
			// Deprecated, for compatibility reasons will be kept to 0
			expirationTimestamp: 0
		});
	});
};
