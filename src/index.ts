import { Server } from './classes/Server.ts';

const server = new Server();

process
	.on('SIGTERM', () => {
		server.self.stop();
		process.exit(0);
	})
	.on('SIGINT', () => {
		server.self.stop();
		process.exit(0);
	});
