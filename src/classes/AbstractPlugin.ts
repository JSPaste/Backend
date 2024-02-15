import type { Elysia } from 'elysia';

export abstract class AbstractPlugin {
	protected readonly server: Elysia;

	protected constructor(server: Elysia) {
		this.server = server;
	}

	protected abstract load(): Elysia;
}
