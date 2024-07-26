import { decode, encode } from 'cbor-x';
import { config } from '../server.ts';
import { errorHandler } from '../server/errorHandler.ts';
import type { Document } from '../types/Document.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';
import { validator } from './validator.ts';

export const storage = {
	read: async (name: string): Promise<Document> => {
		validator.validateName(name);

		const file = Bun.file(config.storagePath + name);

		if (!(await file.exists())) {
			errorHandler.send(ErrorCode.documentNotFound);
		}

		return decode(Buffer.from(await file.arrayBuffer()));
	},

	write: async (name: string, document: Document): Promise<void> => {
		await Bun.write(config.storagePath + name, encode(document));
	}
} as const;
