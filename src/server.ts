import { OpenAPIHono } from '@hono/zod-openapi';
import { serve } from 'bun';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { oas } from '#server/oas.ts';
import { env } from '#util/env.ts';
import { logger } from '#util/logger.ts';
import { config } from './config.ts';
import { endpoints } from './server/endpoints.ts';
import { errorHandler } from './server/errorHandler.ts';
import { ErrorCode } from './types/ErrorHandler.ts';

process.on('SIGTERM', async () => await backend.stop());

logger.set(env.logLevel);

const instance = new OpenAPIHono().basePath(config.apiPath);

export const server = (): typeof instance => {
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

	oas(instance);
	endpoints(instance);

	logger.debug('Registered routes:', instance.routes);
	logger.info(`Listening on: http://localhost:${env.port}`);

	return instance;
};

const backend = serve({
	fetch: server().fetch,
	port: env.port
});
