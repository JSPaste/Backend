import { type OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { storage } from '@x-document/storage.ts';
import { compression } from '../../document/compression.ts';
import { validator } from '../../document/validator.ts';
import { config } from '../../server.ts';
import { errorHandler, schema } from '../../server/errorHandler.ts';
import { ErrorCode } from '../../types/ErrorHandler.ts';

export const accessRoute = (endpoint: OpenAPIHono): void => {
	const route = createRoute({
		method: 'get',
		path: '/{name}',
		tags: ['v2'],
		summary: 'Get document',
		request: {
			params: z.object({
				name: z.string().min(config.documentNameLengthMin).max(config.documentNameLengthMax).openapi({
					description: 'The document name',
					example: 'abc123'
				})
			}),
			headers: z.object({
				password: z.string().optional().openapi({
					description: 'The password to access the document',
					example: 'aabbccdd11223344'
				})
			})
		},
		responses: {
			200: {
				content: {
					'application/json': {
						schema: z.object({
							key: z.string().openapi({
								description: 'The document name (formerly key)',
								example: 'abc123'
							}),
							data: z.string().openapi({
								description: 'The document data',
								example: 'Hello, World!'
							}),
							url: z.string().openapi({
								description: 'The document URL',
								example: 'https://jspaste.eu/abc123'
							}),
							expirationTimestamp: z.number().openapi({
								deprecated: true,
								description: 'The document expiration timestamp (always will be 0)',
								example: 0
							})
						})
					}
				},
				description: 'The document object'
			},
			400: schema,
			404: schema,
			500: schema
		}
	});

	endpoint.openapi(
		route,
		async (ctx) => {
			const params = ctx.req.valid('param');
			const headers = ctx.req.valid('header');

			const document = await storage.read(params.name);

			if (document.header.passwordHash) {
				if (!headers.password) {
					return errorHandler.send(ErrorCode.documentPasswordNeeded);
				}

				validator.validatePassword(headers.password, document.header.passwordHash);
			}

			const buffer = compression.decode(document.data);

			return ctx.json({
				key: params.name,
				data: buffer.toString('binary'),
				url: config.protocol.concat(new URL(ctx.req.url).host.concat('/', params.name)),
				expirationTimestamp: 0
			});
		},
		(result) => {
			if (!result.success) {
				return errorHandler.send(ErrorCode.validation);
			}
		}
	);
};
