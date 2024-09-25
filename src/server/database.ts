import { Database } from 'bun:sqlite';
import fs from 'node:fs';
import { logger } from '../logger.ts';
import { config, env } from '../server.ts';

export const database = {
	open: (): Database => {
		if (!fs.existsSync(config.storagePath)) {
			fs.mkdirSync(config.storagePath);
		}

		const database = new Database(env.debugDB ? undefined : 'storage/backend.db', {
			strict: true
		});

		!env.debugDB && database.run('PRAGMA journal_mode = WAL;');

		let databaseVersion = 0;
		try {
			const result = database.prepare('SELECT config.version FROM config;').get();

			if (result && typeof result.version === 'number') {
				databaseVersion = result.version;
			}
		} catch {
			logger.info('Initializing new database...');
		}

		for (const [version, migration] of Object.entries(migrations)) {
			const versionNumber = Number.parseInt(version);

			logger.debug('DB:', databaseVersion, 'Now:', versionNumber);

			if (databaseVersion < versionNumber) {
				try {
					migration(database);
					database.run(`INSERT
                    OR REPLACE INTO config (version) VALUES (
                    ${versionNumber}
                    );`);
					logger.info(`Migration ${versionNumber} applied successfully.`);
				} catch (error) {
					logger.error(`Migration ${version} failed! Stopping...`);
					process.exit(1);
				}
			}
		}

		return database;
	},

	close: (database: Database, graceful: boolean) => {
		database.close(!graceful);
	}
};

const migrations = {
	/**
	 * Initial schema.
	 *
	 * @date 2024-07-31
	 * @param database
	 */
	1: (database: Database): void => {
		database.run(`CREATE TABLE config
                      (
                          version INTEGER PRIMARY KEY
                      );`);

		database.run(`CREATE TABLE documents
                      (
                          id           INTEGER PRIMARY KEY AUTOINCREMENT,
                          name         TEXT    NOT NULL,
                          secretHash   TEXT    NOT NULL,
                          passwordHash TEXT,
                          version      INTEGER NOT NULL
                      );`);
	},
	2: (): void => {
		// Migration 2
	},
	3: (): void => {
		// Migration 3
	}
};
