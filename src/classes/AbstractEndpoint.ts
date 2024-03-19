import type { Server } from './Server.ts';

export abstract class AbstractEndpoint {
	protected readonly SERVER: Server;
	protected PREFIX = '';

	public constructor(server: Server) {
		this.SERVER = server;
	}

	public setPrefix(prefix: string): this {
		this.PREFIX = prefix;
		return this;
	}

	public register(): void {
		this.run();
	}

	protected abstract run(): void;
}
