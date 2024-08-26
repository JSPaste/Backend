import { env, server } from './server.ts';

// TODO: Support graceful shutdown
process.on('SIGTERM', () => process.exit(0));

export default {
	port: env.port,
	fetch: server().fetch
};
