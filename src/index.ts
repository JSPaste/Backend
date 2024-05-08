import { Server } from './classes/Server.ts';

const instance = new Server().instance;

export default {
	port: Server.PORT,
	fetch: instance.fetch
};
