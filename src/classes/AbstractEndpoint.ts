import type { Server } from './Server.ts';

export abstract class AbstractEndpoint {
	protected readonly server: Server;
	protected prefix = '';

	protected constructor(server: Server) {
		this.server = server;
	}

	public setPrefix(prefix: string): this {
		this.prefix = prefix;
		return this;
	}

	public register(): void {
		this.run();
	}

	protected abstract run(): void;
}
