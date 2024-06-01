import { type OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { compression } from '../../document/compression.ts';
import { storage } from '../../document/storage.ts';
import { errorHandler, schema } from '../../errorHandler.ts';
import { config } from '../../server.ts';
import { ErrorCode } from '../../types/ErrorHandler.ts';

export const accessRoute = (endpoint: OpenAPIHono): void => {
	const route = createRoute({
		method: 'get',
		path: '/{name}',
		tags: ['v1'],
		summary: 'Get document',
		deprecated: true,
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

		const document = await storage.read(params.name);

		// V1 Endpoint does not support Server-Side Encryption
		if (document.header.passwordHash) {
			errorHandler.send(ErrorCode.documentPasswordNeeded);
		}

		const buffer = await compression.decode(document.data);

		return ctx.json({
			key: params.name,
			data: buffer.toString('binary')
		});
	});
};
