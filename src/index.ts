import { Server } from './classes/Server.ts';
import type { ServerOptions } from './interfaces/ServerOptions.ts';

const options: Partial<ServerOptions> = {
	// Override default options on 'defaultServerOptions' here
};

new Server(options).run();
