import type { OpenAPIHono } from '@hono/zod-openapi';
import { config, env } from '../server.ts';
import { middleware } from './middleware.ts';

export const documentation = (instance: OpenAPIHono): void => {
	instance.doc31('/oas.json', (ctx) => ({
		openapi: '3.1.0',
		info: {
			title: 'JSPaste API',
			version: 'rolling',
			description: `Note: The latest API version can be accessed with "${config.apiPath}/documents" alias route.`,
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
				url: 'https://jspaste.eu',
				description: 'Official JSPaste instance'
			},
			{
				url: 'https://paste.inetol.net',
				description: 'Inetol Infrastructure instance'
			}
		]
	}));

	instance.get(env.docsPath, middleware.scalar());
};
