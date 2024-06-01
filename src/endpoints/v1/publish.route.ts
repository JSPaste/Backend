import { type OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { compression } from '../../document/compression.ts';
import { crypto } from '../../document/crypto.ts';
import { storage } from '../../document/storage.ts';
import { schema } from '../../errorHandler.ts';
import { middleware } from '../../middleware.ts';
import { StringUtils } from '../../utils/StringUtils.ts';

export const publishRoute = (endpoint: OpenAPIHono): void => {
	const route = createRoute({
		method: 'post',
		path: '/',
		tags: ['v1'],
		summary: 'Publish document',
		deprecated: true,
		middleware: [middleware.bodyLimit()],
		request: {
			body: {
				content: {},
				description: 'Hello, World!'
			}
		},
		responses: {
			200: {
				content: {
					'application/json': {
						schema: z.object({
							key: z.string({ description: 'The document name (formerly key)' }).openapi({
								example: 'abc123'
							}),
							secret: z.string({ description: 'The document secret' }).openapi({
								example: 'aaaaa-bbbbb-ccccc-ddddd'
							})
						})
					}
				},
				description: 'The document credentials'
			},
			400: schema,
			404: schema,
			500: schema
		}
	});

	endpoint.openapi(route, async (ctx) => {
		const body = await ctx.req.arrayBuffer();
		const name = await StringUtils.createName();
		const secret = StringUtils.createSecret();

		await storage.write(name, {
			data: await compression.encode(body),
			header: {
				name: name,
				secretHash: crypto.hash(secret) as string,
				passwordHash: null
			}
		});

		return ctx.json({ key: name, secret: secret });
	});
};
