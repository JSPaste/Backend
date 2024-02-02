import { Server } from './classes/Server.ts';

const app = new Server();

app.run();

// FIXME(inetol): Handle exit properly (Docker)
process.on('exit', () => {
	console.log('Bye');
	app.getApplication.stop();
});
