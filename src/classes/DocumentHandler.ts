import { DocumentManager } from './DocumentManager';
import { DataValidator } from './DataValidator';
import { basePath } from '../utils/constants.ts';
import { ErrorSender, type JSPError } from './ErrorSender.ts';

export interface AccessResponse {
	key: string;
	data: string;
}

export class DocumentHandler {
	static async handleAccess({
		id,
		password
	}: {
		id: string;
		password?: string;
	}): Promise<AccessResponse | JSPError> {
		if (!DataValidator.isAlphanumeric(id))
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: 'jsp.invalid_input',
				message: 'Invalid ID provided'
			}).response;

		const file = Bun.file(basePath + id);

		const fileExists = await file.exists();

		if (!fileExists)
			return ErrorSender.sendError(404, {
				type: 'error',
				errorCode: 'jsp.file_not_found',
				message: 'The requested file does not exist'
			}).response;

		const doc = await DocumentManager.read(file);

		if (doc.password !== password)
			return ErrorSender.sendError(404, {
				type: 'error',
				errorCode: 'jsp.file_not_found',
				message: 'The requested file does not exist'
			}).response;

		return {
			key: id,
			data: new TextDecoder().decode(doc.rawFileData)
		};
	}
}
