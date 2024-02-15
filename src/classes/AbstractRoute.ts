import type { Elysia } from 'elysia';

export abstract class AbstractRoute {
	protected readonly server: Elysia;

	protected constructor(server: Elysia) {
		this.server = server;
	}

	protected abstract register(path: string): Elysia;
}
