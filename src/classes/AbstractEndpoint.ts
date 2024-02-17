import type { Elysia } from 'elysia';

export abstract class AbstractEndpoint {
	protected readonly server: Elysia;

	protected constructor(server: Elysia) {
		this.server = server;
	}

	protected abstract register(prefix: string): void;
}
