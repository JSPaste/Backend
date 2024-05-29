import { cors } from '@hono/hono/cors';
import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { get as envvar } from 'env-var';
import type { LogLevelNames } from 'loglevel';
import { Logger } from './classes/Logger.ts';
import { v1 } from './endpoints/v1';
import { v2 } from './endpoints/v2';

export const env = {
	PORT: envvar('PORT').default(4000).asPortNumber(),
	LOGLEVEL: envvar('LOGLEVEL').default('info').asString(),
	DOCUMENT_TLS: envvar('DOCUMENT_TLS').asBoolStrict() ?? false,
	DOCUMENT_DOMAIN: envvar('DOCUMENT_DOMAIN').default('localhost').asString(),
	DOCUMENT_MAXSIZE: envvar('DOCUMENT_MAXSIZE').default(1024).asIntPositive(),
	DOCS_ENABLED: envvar('DOCS_ENABLED').asBoolStrict() ?? false,
	DOCS_PATH: envvar('DOCS_PATH').default('/docs').asString()
} as const;

export const config = {
	HOSTNAME: (env.DOCUMENT_TLS ? 'https://' : 'http://').concat(env.DOCUMENT_DOMAIN),
	PATH: '/api',
	SYSTEM_DOCUMENT_PATH: 'documents/',
	DOCUMENT_NAME_LENGTH_MIN: 2,
	DOCUMENT_NAME_LENGTH_MAX: 32,
	DOCUMENT_NAME_LENGTH_DEFAULT: 8
} as const;

export const server = {
	instance: new OpenAPIHono().basePath(config.PATH),

	run: (): void => {
		Logger.init(env.LOGLEVEL as LogLevelNames);

		const initInstance = (): void => {
			server.instance.use('*', cors());

			server.instance.onError((err, ctx) => {
				return ctx.json(JSON.parse(err.message));
			});

			server.instance.notFound((ctx) => {
				ctx.status(404);

				return ctx.body(null);
			});
		};

		const initEndpoints = (): void => {
			server.instance.route('/v1/documents', v1());
			server.instance.route('/v2/documents', v2());
			server.instance.route('/documents', v2());
		};

		const initDocs = (): void => {
			server.instance.doc('/oas.json', {
				openapi: '3.0.3',
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
						url: 'https://paste.inetol.net',
						description: 'Inetol Infrastructure instance'
					},
					{
						url: 'http://localhost:4000',
						description: 'Local instance (Only use if you are running the backend locally)'
					}
				]
			});

			server.instance.get(
				env.DOCS_PATH,
				apiReference({
					pageTitle: 'JSPaste Documentation',
					theme: 'saturn',
					layout: 'classic',
					isEditable: false,
					spec: {
						url: config.PATH.concat('/oas.json')
					}
				})
			);
		};

		initInstance();
		initEndpoints();
		env.DOCS_ENABLED && initDocs();

		Logger.info('Registered', server.instance.routes.length, 'routes');
		Logger.debug(
			'Registered routes:',
			server.instance.routes.map((route) => route.path)
		);
		Logger.info(`Listening on: http://localhost:${env.PORT}`);
	}
} as const;
