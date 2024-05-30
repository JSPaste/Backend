import { env, server } from './server.ts';

export default {
	port: env.port,
	fetch: server().fetch
};
