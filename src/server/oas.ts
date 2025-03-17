import type { OpenAPIHono } from '@hono/zod-openapi';
import { config } from '../config.ts';

export const oas = (instance: OpenAPIHono): void => {
	instance.doc31('/oas.json', (ctx) => ({
		openapi: '3.1.0',
		info: {
			title: 'JSPaste API',
			version: 'rolling',
			description: `Note: The latest API version can be accessed with "${config.apiPath}/documents" alias route.`,
			license: {
				name: 'EUPL-1.2',
				url: 'https://eur-lex.europa.eu/eli/dec_impl/2017/863'
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
		].filter((server, index, self) => self.findIndex((x) => x.url === server.url) === index)
	}));
};
