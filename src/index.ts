import { Server } from './classes/Server.ts';

const server = new Server();

process.on('SIGTERM', () => {
	server.getElysia.stop().finally(process.exit(0));
});
