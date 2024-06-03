import { type OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { validator } from '../../document/validator.ts';
import { errorHandler, schema } from '../../errorHandler.ts';
import { config } from '../../server.ts';
import { ErrorCode } from '../../types/ErrorHandler.ts';

export const existsRoute = (endpoint: OpenAPIHono): void => {
	const route = createRoute({
		method: 'get',
		path: '/{name}/exists',
		tags: ['v2'],
		summary: 'Check document',
		request: {
			params: z.object({
				name: z.string().min(config.documentNameLengthMin).max(config.documentNameLengthMax).openapi({
					description: 'The document name',
					example: 'abc123'
				})
			})
		},
		responses: {
			200: {
				content: {
					'text/plain': {
						schema: z.string().openapi({
							description: 'The document existence result'
						}),
						examples: {
							true: {
								summary: 'Document exists',
								value: 'true'
							},
							false: {
								summary: 'Document does not exist',
								value: 'false'
							}
						}
					}
				},
				description: 'The document existence result'
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

			validator.validateName(params.name);

			return ctx.text(String(await Bun.file(config.storagePath + params.name).exists()));
		},
		(result) => {
			if (!result.success) {
				throw errorHandler.send(ErrorCode.validation);
			}
		}
	);
};
