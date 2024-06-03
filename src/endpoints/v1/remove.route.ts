import { unlink } from 'node:fs/promises';
import { type OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { storage } from '../../document/storage.ts';
import { validator } from '../../document/validator.ts';
import { schema } from '../../errorHandler.ts';
import { config } from '../../server.ts';

export const removeRoute = (endpoint: OpenAPIHono): void => {
	const route = createRoute({
		method: 'delete',
		path: '/{name}',
		tags: ['v1'],
		summary: 'Remove document',
		deprecated: true,
		request: {
			params: z.object({
				name: z.string().min(config.documentNameLengthMin).max(config.documentNameLengthMax).openapi({
					description: 'The document name',
					example: 'abc123'
				})
			}),
			headers: z.object({
				secret: z.string().min(1).openapi({
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
							removed: z.boolean().openapi({
								description: 'Confirmation of deletion',
								example: true
							})
						})
					}
				},
				description: 'An object with a "removed" parameter of the deleted document'
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

		validator.validateSecret(headers.secret, document.header.secretHash);

		return ctx.json({
			removed: await unlink(config.storagePath + params.name)
				.then(() => true)
				.catch(() => false)
		});
	});
};
