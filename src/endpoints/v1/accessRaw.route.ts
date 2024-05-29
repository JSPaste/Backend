import { brotliDecompressSync } from 'node:zlib';
import { type OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { ErrorHandler } from '../../classes/ErrorHandler.ts';
import { config } from '../../server.ts';
import { ErrorCode } from '../../types/ErrorHandler.ts';
import { DocumentUtils } from '../../utils/DocumentUtils.ts';

export const accessRawRoute = (endpoint: OpenAPIHono) => {
	const route = createRoute({
		method: 'get',
		path: '/{name}/raw',
		tags: ['v1'],
		summary: 'Get raw document',
		deprecated: true,
		request: {
			params: z.object({
				name: z
					.string()
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
						schema: z.any().openapi({
							example: 'Hello, World!'
						})
					}
				},
				description: 'The raw document'
			},
			400: ErrorHandler.SCHEMA,
			404: ErrorHandler.SCHEMA
		}
	});

	endpoint.openapi(route, async (ctx) => {
		const params = ctx.req.valid('param');

		DocumentUtils.validateName(params.name);

		const document = await DocumentUtils.documentReadV1(params.name);

		// V1 Endpoint does not support Server-Side Encryption
		if (document.header.passwordHash) {
			ErrorHandler.send(ErrorCode.documentPasswordNeeded);
		}

		ctx.header('Content-Type', 'text/plain;charset=utf-8');

		return ctx.body(brotliDecompressSync(document.data));
	});
};
