import { type OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { storage } from '@x-document/storage.ts';
import { compression } from '../../document/compression.ts';
import { validator } from '../../document/validator.ts';
import { config } from '../../server.ts';
import { errorHandler, schema } from '../../server/errorHandler.ts';
import { middleware } from '../../server/middleware.ts';
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
				content: {
					'text/plain': {
						schema: z.string().openapi({
							description: 'Data to replace in the document',
							example: 'Hello, World!'
						})
					}
				}
			},
			params: z.object({
				name: z.string().min(config.documentNameLengthMin).max(config.documentNameLengthMax).openapi({
					description: 'The document name',
					example: 'abc123'
				})
			}),
			headers: z.object({
				password: z.string().optional().openapi({
					deprecated: true,
					description: 'The password to access the document (not used anymore)',
					example: 'aabbccdd11223344'
				}),
				secret: z.string().openapi({
					description: 'The document secret',
					example: 'aaaaa-bbbbb-ccccc-ddddd'
				})
			})
		},
		responses: {
			200: {
				content: {
					'application/json': {
						schema: z.object({
							edited: z.boolean().openapi({
								description: 'Confirmation of edition',
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

	endpoint.openapi(
		route,
		async (ctx) => {
			const body = await ctx.req.arrayBuffer();
			const params = ctx.req.valid('param');
			const headers = ctx.req.valid('header');

			const document = await storage.read(params.name);

			validator.validateSecret(headers.secret, document.header.secretHash);

			document.data = compression.encode(body);

			const result = await storage
				.write(params.name, document)
				.then(() => true)
				.catch(() => false);

			return ctx.json({
				edited: result
			});
		},
		(result) => {
			if (!result.success) {
				return errorHandler.send(ErrorCode.validation);
			}
		}
	);
};
