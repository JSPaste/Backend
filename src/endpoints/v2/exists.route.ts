import { type OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { validator } from '../../document/validator.ts';
import { schema } from '../../errorHandler.ts';
import { config } from '../../server.ts';

export const existsRoute = (endpoint: OpenAPIHono): void => {
	const route = createRoute({
		method: 'get',
		path: '/{name}/exists',
		tags: ['v2'],
		summary: 'Check document',
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
					'text/plain': {
						schema: z.string({ description: 'The document existence result' }),
						example: 'true'
					}
				},
				description: 'The document existence result'
			},
			400: schema,
			404: schema,
			500: schema
		}
	});

	endpoint.openapi(route, async (ctx) => {
		const params = ctx.req.valid('param');

		validator.validateName(params.name);

		return ctx.text(String(await Bun.file(config.storagePath + params.name).exists()));
	});
};
