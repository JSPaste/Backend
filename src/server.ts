import { OpenAPIHono } from '@hono/zod-openapi';
import { get as envvar } from 'env-var';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { errorHandler } from './errorHandler.ts';
import { logger } from './logger.ts';
import { documentation } from './server/documentation.ts';
import { endpoints } from './server/endpoints.ts';
import { ErrorCode } from './types/ErrorHandler.ts';

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

	instance.use('*', cors());

	instance.onError((err) => {
		if (err instanceof HTTPException) {
			return err.getResponse();
		}

		logger.error(err);
		throw errorHandler.send(ErrorCode.unknown);
	});

	instance.notFound((ctx) => {
		return ctx.body(null, 404);
	});

	endpoints(instance);
	env.docsEnabled && documentation(instance);

	logger.debug('Registered', instance.routes.length, 'routes');
	logger.debug('Registered routes:', instance.routes);
	logger.info(`Listening on: http://localhost:${env.port}`);

	return instance;
};
