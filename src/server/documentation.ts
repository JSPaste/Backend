import type { OpenAPIHono } from '@hono/zod-openapi';
import { middleware } from '../middleware.ts';
import { config, env } from '../server.ts';

export const documentation = (instance: OpenAPIHono): void => {
	instance.doc31('/oas.json', (ctx) => ({
		openapi: '3.1.0',
		info: {
			title: 'JSPaste API',
			version: 'rolling',
			description: 'Note: The latest API version can be accessed with the "/documents" alias route.',
			license: {
				name: 'EUPL-1.2',
				url: 'https://joinup.ec.europa.eu/sites/default/files/custom-page/attachment/2020-03/EUPL-1.2%20EN.txt'
			}
		},
		servers: [
			{
				url: config.protocol.concat(new URL(ctx.req.url).host),
				description: 'This instance'
			},
			{
				url: config.protocol.concat(new URL(ctx.req.url).host.concat(config.apiPath)),
				description: 'This instance workaround (See https://github.com/honojs/middleware/issues/459)'
			},
			{
				url: 'https://jspaste.eu',
				description: 'Official JSPaste instance'
			},
			{
				url: 'https://jspaste.eu'.concat(config.apiPath),
				description:
					'Official JSPaste instance workaround (See https://github.com/honojs/middleware/issues/459)'
			},
			{
				url: 'https://paste.inetol.net',
				description: 'Inetol Infrastructure instance'
			},
			{
				url: 'https://paste.inetol.net'.concat(config.apiPath),
				description:
					'Inetol Infrastructure instance workaround (See https://github.com/honojs/middleware/issues/459)'
			}
		]
	}));

	instance.get(env.docsPath, middleware.scalar());
};
