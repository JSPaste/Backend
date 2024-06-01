import { brotliCompressSync } from 'node:zlib';
import { type OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { crypto } from '../../document/crypto.ts';
import { storage } from '../../document/storage.ts';
import { validator } from '../../document/validator.ts';
import { errorHandler, schema } from '../../errorHandler.ts';
import { middleware } from '../../middleware.ts';
import { config } from '../../server.ts';
import { ErrorCode } from '../../types/ErrorHandler.ts';

export const editRoute = (endpoint: OpenAPIHono): void => {
	const route = createRoute({
		method: 'patch',
		path: '/{name}',
		tags: ['v2'],
		summary: 'Edit document',
		middleware: [middleware.bodyLimit()],
		request: {
			body: {
				content: {},
				description: 'Hello, World!'
			},
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
				}),
				secret: z.string().openapi({
					description: 'The document secret'
				})
			})
		},
		responses: {
			200: {
				content: {
					'application/json': {
						schema: z.object({
							removed: z.boolean({ description: 'Confirmation of edition' }).openapi({
								example: true
							})
						})
					}
				},
				description: 'Confirmation of edition'
			},
			400: schema,
			404: schema,
			500: schema
		}
	});

	endpoint.openapi(route, async (ctx) => {
		const body = await ctx.req.arrayBuffer();
		const params = ctx.req.valid('param');
		const headers = ctx.req.valid('header');

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
