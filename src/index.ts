import { Server } from './classes/Server.ts';

const server = new Server();

// FIXME(inetol): Handle exit properly (Docker)
process.on('exit', () => {
	console.log('Bye');
	server.self.stop();
});
