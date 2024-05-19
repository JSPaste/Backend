import { ENV } from './classes/ENV.ts';
import { Server } from './classes/Server.ts';

const instance = new Server().instance;

export default {
	port: ENV.PORT,
	fetch: instance.fetch
};
