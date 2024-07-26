import { type OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { compression } from '../../document/compression.ts';
import { crypto } from '../../document/crypto.ts';
import { storage } from '../../document/storage.ts';
import { errorHandler, schema } from '../../server/errorHandler.ts';
import { middleware } from '../../server/middleware.ts';
import { DocumentVersion } from '../../types/Document.ts';
import { ErrorCode } from '../../types/ErrorHandler.ts';
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
				content: {
					'text/plain': {
						schema: z.string().openapi({
							description: 'Data to publish in the document',
							example: 'Hello, World!'
						})
					}
				}
			}
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
							secret: z.string().openapi({
								description: 'The document secret',
								example: 'aaaaa-bbbbb-ccccc-ddddd'
							})
						})
					}
				},
				description: 'An object with a "name" and "secret" parameters of the created document'
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
			const name = await StringUtils.createName();
			const secret = StringUtils.createSecret();

			await storage.write(name, {
				data: await compression.encode(body),
				header: {
					name: name,
					secretHash: crypto.hash(secret) as string,
					passwordHash: null
				},
				version: DocumentVersion.V1
			});

			return ctx.json({ key: name, secret: secret });
		},
		(result) => {
			if (!result.success) {
				return errorHandler.send(ErrorCode.validation);
			}
		}
	);
};
