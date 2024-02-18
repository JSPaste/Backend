import type { Server } from './Server.ts';

export abstract class AbstractEndpoint {
	protected readonly server: Server;

	protected constructor(server: Server) {
		this.server = server;
	}

	protected abstract register(prefix: string): void;
}
