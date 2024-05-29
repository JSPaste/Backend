import { env, server } from './server.ts';

server.run();

export default {
	port: env.PORT,
	fetch: server.instance.fetch
};
