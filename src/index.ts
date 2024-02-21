import { Server } from './classes/Server.ts';

const server = new Server();

process.on('SIGTERM', () => {
	server.getElysia.stop().then(process.exit(0));
});
