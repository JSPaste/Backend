import { DocumentManager } from './DocumentManager';
import { DataValidator } from './DataValidator';
import { basePath } from '../utils/constants.ts';
import { ErrorSender } from './ErrorSender.ts';

export interface AccessResponse {
	key: string;
	data: string;
}

export class DocumentHandler {
	static async handleAccess({ id, password }: { id: string; password?: string }) {
		if (!DataValidator.isAlphanumeric(id))
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: 'jsp.invalid_input',
				message: 'Invalid ID provided'
			});

		const file = Bun.file(basePath + id);

		const fileExists = await file.exists();

		if (!fileExists)
			return ErrorSender.sendError(404, {
				type: 'error',
				errorCode: 'jsp.file_not_found',
				message: 'The requested file does not exist'
			});

		const doc = await DocumentManager.read(file);

		if (doc.password !== password)
			return ErrorSender.sendError(404, {
				type: 'error',
				errorCode: 'jsp.file_not_found',
				message: 'The requested file does not exist'
			});

		return {
			key: id,
			data: new TextDecoder().decode(doc.rawFileData)
		};
	}
}
