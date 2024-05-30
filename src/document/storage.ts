import { decode, encode } from 'cbor-x';
import { errorHandler } from '../errorHandler.ts';
import { config } from '../server.ts';
import type { DocumentV1 } from '../types/Document.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';
import { validator } from './validator.ts';

export const storage = {
	read: async (name: string): Promise<DocumentV1> => {
		validator.validateName(name);

		const file = Bun.file(config.storagePath + name);

		if (!(await file.exists())) {
			errorHandler.send(ErrorCode.documentNotFound);
		}

		return decode(Buffer.from(await file.arrayBuffer()));
	},

	write: async (name: string, document: Omit<DocumentV1, 'version'>): Promise<void> => {
		await Bun.write(config.storagePath + name, encode({ ...document, version: 1 }));
	}
} as const;
