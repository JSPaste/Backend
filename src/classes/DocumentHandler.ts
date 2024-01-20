import { DocumentManager } from './DocumentManager';
import { DataValidator } from './DataValidator';
import { basePath, maxDocLength } from '../utils/constants.ts';
import { ErrorSender } from './ErrorSender.ts';
import { createKey, createSecret } from '../utils/createKey.ts';
import type { DocumentDataStruct } from '../structures/documentStruct.ts';

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

	static async handleEdit({
		id,
		newBody,
		secret
	}: {
		id: string;
		newBody: any;
		secret?: string;
	}) {
		if (!DataValidator.isAlphanumeric(id))
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: 'jsp.invalid_input',
				message: 'Invalid ID provided'
			});

		const file = Bun.file(basePath + id);

		const fileExists = await file.exists();

		if (!fileExists)
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: 'jsp.file_not_found',
				message: 'The requested file does not exist'
			});

		const buffer = Buffer.from(newBody as ArrayBuffer);

		if (!DataValidator.isLengthBetweenLimits(buffer, 1, maxDocLength))
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: 'jsp.invalid_file_length',
				message: 'The document data its outside of max length or is null'
			});

		const doc = await DocumentManager.read(file);

		if (doc.secret !== secret)
			return ErrorSender.sendError(403, {
				type: 'error',
				errorCode: 'jsp.invalid_secret',
				message: 'The secret is not correct'
			});

		doc.rawFileData = buffer;

		await DocumentManager.write(basePath + id, doc);

		return { message: 'File updated successfully' };
	}

	static async handlePublish({
		body,
		selectedSecret,
		password
	}: {
		body: any;
		selectedSecret?: string;
		password?: string;
	}) {
		const buffer = Buffer.from(body as ArrayBuffer);

		if (!DataValidator.isLengthBetweenLimits(buffer, 1, maxDocLength)) {
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: 'jsp.invalid_file_length',
				message: 'The document data its outside of max length or is null'
			});
		}

		const selectedKey = await createKey();

		const secret = selectedSecret || createSecret();

		if (!DataValidator.isLengthBetweenLimits(secret, 1, 200)) {
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: 'jsp.invalid_secret',
				message: 'The provided secret is too big or is null'
			});
		}

		const newDoc: DocumentDataStruct = {
			rawFileData: buffer,
			secret: secret,
			deletionTime: BigInt(0),
			password: password
		};

		await DocumentManager.write(basePath + selectedKey, newDoc);

		return { key: selectedKey, secret: selectedSecret };
	}
}
