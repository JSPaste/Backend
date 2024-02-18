import { Server } from './classes/Server.ts';

const server = new Server();

process
	.on('SIGTERM', () => {
		server.getElysia.stop();
		process.exit(0);
	})
	.on('SIGINT', () => {
		server.getElysia.stop();
		process.exit(0);
	});
