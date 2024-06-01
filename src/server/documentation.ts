import { middleware } from '../middleware.ts';
import { config, env, instance } from '../server.ts';

export const documentation = (): void => {
	instance.doc31('/oas.json', {
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
			},
			{
				url: 'http://localhost:4000',
				description: 'Local instance (Only use if you are running the backend locally)'
			},
			{
				url: 'http://localhost:4000'.concat(config.apiPath),
				description:
					'Local instance workaround (Only use if you are running the backend locally, see https://github.com/honojs/middleware/issues/459)'
			}
		]
	});

	instance.get(env.docsPath, middleware.scalar());
};
