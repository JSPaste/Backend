import { type OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { compression } from '../../document/compression.ts';
import { storage } from '../../document/storage.ts';
import { validator } from '../../document/validator.ts';
import { errorHandler, schema } from '../../errorHandler.ts';
import { config } from '../../server.ts';
import { ErrorCode } from '../../types/ErrorHandler.ts';

export const accessRawRoute = (endpoint: OpenAPIHono) => {
	const route = createRoute({
		method: 'get',
		path: '/{name}/raw',
		tags: ['v1'],
		summary: 'Get raw document data',
		deprecated: true,
		request: {
			params: z.object({
				name: z
					.string()
					.min(config.DOCUMENT_NAME_LENGTH_MIN)
					.max(config.DOCUMENT_NAME_LENGTH_MAX)
					.openapi({
						description: 'The document name',
						examples: ['abc123']
					})
			})
		},
		responses: {
			200: {
				content: {
					'text/plain': {
						schema: z.any(),
						example: 'Hello, World!'
					}
				},
				description: 'The raw document data'
			},
			400: schema,
			404: schema,
			500: schema
		}
	});

	endpoint.openapi(route, async (ctx) => {
		const params = ctx.req.valid('param');

		validator.validateName(params.name);

		const document = await storage.read(params.name);

		// V1 Endpoint does not support Server-Side Encryption
		if (document.header.passwordHash) {
			errorHandler.send(ErrorCode.documentPasswordNeeded);
		}

		const buffer = await compression.decode(document.data);

		return ctx.text(buffer.toString('binary'));
	});
};
