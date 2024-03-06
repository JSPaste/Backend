import type { Server } from './Server.ts';

export abstract class AbstractEndpoint {
	protected readonly server: Server;
	protected prefix = '';
	protected headers: Record<string, string>[] = [];

	public constructor(server: Server) {
		this.server = server;
	}

	public setPrefix(prefix: string): this {
		this.prefix = prefix;
		return this;
	}

	// TODO
	public setHeader(header: Record<string, string>): this {
		this.headers.push(header);
		return this;
	}

	public register(): void {
		this.run();
	}

	protected abstract run(): void;
}
