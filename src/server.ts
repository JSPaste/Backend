import { OpenAPIHono } from '@hono/zod-openapi';
import { get as envvar } from 'env-var';
import { cors } from 'hono/cors';
import { v1 } from './endpoints/v1';
import { v2 } from './endpoints/v2';
import { logger } from './logger.ts';
import { middleware } from './middleware.ts';

const initInstance = (): void => {
	instance.use('*', cors());

	instance.onError((err, ctx) => {
		return ctx.json(JSON.parse(err.message));
	});

	instance.notFound((ctx) => {
		return ctx.body(null, 404);
	});
};

const initEndpoints = (): void => {
	instance.route('/v1/documents', v1());
	instance.route('/v2/documents', v2());
	instance.route('/documents', v2());
};

const initDocs = (): void => {
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

export const env = {
	port: envvar('PORT').default(4000).asPortNumber(),
	logLevel: envvar('LOGLEVEL').default(2).asIntPositive(),
	documentTLS: envvar('DOCUMENT_TLS').asBoolStrict() ?? false,
	documentDomain: envvar('DOCUMENT_DOMAIN').default('localhost').asString(),
	documentMaxSize: envvar('DOCUMENT_MAXSIZE').default(1024).asIntPositive(),
	docsEnabled: envvar('DOCS_ENABLED').asBoolStrict() ?? false,
	docsPath: envvar('DOCS_PATH').default('/docs').asString()
} as const;

export const config = {
	hostname: (env.documentTLS ? 'https://' : 'http://').concat(env.documentDomain),
	apiPath: '/api',
	storagePath: 'documents/',
	documentNameLengthMin: 2,
	documentNameLengthMax: 32,
	documentNameLengthDefault: 8
} as const;

const instance = new OpenAPIHono().basePath(config.apiPath);

export const server = (): typeof instance => {
	logger.set(env.logLevel);

	initInstance();
	initEndpoints();
	env.docsEnabled && initDocs();

	logger.debug('Registered', instance.routes.length, 'routes');
	logger.debug(
		'Registered routes:',
		instance.routes.map((route) => route.path)
	);
	logger.info(`Listening on: http://localhost:${env.port}`);

	return instance;
};
