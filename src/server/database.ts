import { Database as BunSQLite } from 'bun:sqlite';
import fs from 'node:fs';
import { config, env } from '../server.ts';

// TODO: Implement database
export class Database {
	private readonly database: BunSQLite;

	public constructor() {
		if (!fs.existsSync(config.storagePath)) {
			fs.mkdirSync(config.storagePath);
		}

		this.database = new BunSQLite(env.debugDB ? undefined : './storage/backend.db', {
			strict: true
		});

		// this.migrations();
	}

	public get instance(): BunSQLite {
		return this.database;
	}

	public close(graceful: boolean): void {
		this.database.close(!graceful);
	}
}
