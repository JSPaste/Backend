import type { Elysia } from 'elysia';

export abstract class RouteHandler {
	protected readonly server: Elysia;

	protected constructor(server: Elysia) {
		this.server = server;
	}

	protected abstract group(group: string): this;

	protected abstract register(path: string): void;
}
