import { logger } from './logger.ts';
import { env, server } from './server.ts';

logger.set(env.logLevel);

export default {
	port: env.port,
	fetch: server().fetch
};
