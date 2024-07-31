import { OpenAPIHono } from '@hono/zod-openapi';
import { get as envvar } from 'env-var';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from './logger.ts';
import { documentation } from './server/documentation.ts';
import { endpoints } from './server/endpoints.ts';
import { errorHandler } from './server/errorHandler.ts';
import { ErrorCode } from './types/ErrorHandler.ts';

export const env = {
	port: envvar('PORT').default(4000).asPortNumber(),
	logLevel: envvar('LOGLEVEL').default(2).asIntPositive(),
	tls: envvar('TLS').asBoolStrict() ?? true,
	salt: envvar('SALT').asString(),
	documentMaxSize: envvar('DOCUMENT_MAXSIZE').default(1024).asIntPositive(),
	docsEnabled: envvar('DOCS_ENABLED').asBoolStrict() ?? false,
	docsPath: envvar('DOCS_PATH').default('/docs').asString()
} as const;

export const config = {
	protocol: env.tls ? 'https://' : 'http://',
	apiPath: '/api',
	storagePath: 'documents/',
	documentNameLengthMin: 2,
	documentNameLengthMax: 32,
	documentNameLengthDefault: 8
} as const;

const instance = new OpenAPIHono().basePath(config.apiPath);

export const server = (): typeof instance => {
	logger.set(env.logLevel);

	// Check env
	if (!env.salt) {
		logger.error('"SALT" value not specified, can\'t continue...');
		logger.warn('Update your "SALT" environment value, see more at:');
		logger.warn('https://github.com/jspaste/backend/raw/stable/.env.example');
		process.exit(1);
	}

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
