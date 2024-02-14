import { Server } from './classes/Server.ts';

const server = new Server();

process
	.on('SIGTERM', () => {
		console.log('Received SIGTERM. Bye');
		server.self.stop();
		process.exit(0);
	})
	.on('SIGINT', () => {
		console.log('Received SIGINT. Bye');
		server.self.stop();
		process.exit(0);
	});
