import { deserialize, serialize } from 'bun:jsc';
import { validator } from '#document/validator.ts';
import { errorHandler } from '#server/errorHandler.ts';
import type { Document } from '#type/Document.ts';
import { ErrorCode } from '#type/ErrorHandler.ts';
import { config } from '../config.ts';

export const storage = {
	read: async (name: string): Promise<Document> => {
		validator.validateName(name);

		const file = Bun.file(config.storagePath + name);

		if (!(await file.exists())) {
			errorHandler.send(ErrorCode.documentNotFound);
		}

		return deserialize(await file.arrayBuffer());
	},

	write: async (name: string, document: Document): Promise<void> => {
		await Bun.write(config.storagePath + name, serialize(document));
	}
} as const;
