import { unlink } from 'node:fs/promises';
import { ErrorSender } from './ErrorSender.ts';
import { DataValidator } from './DataValidator';
import { DocumentManager } from './DocumentManager';
import { basePath, maxDocLength } from '../utils/constants.ts';
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

		if (doc.password && doc.password !== password)
			return ErrorSender.sendError(403, {
				type: 'error',
				errorCode: 'jsp.invalid_password',
				message: 'This file needs credentials, however no credentials were provided'
			});

		if (
			doc.deletionTime &&
			doc.deletionTime > 0 &&
			doc.deletionTime <= getUnixTimespanSecconds()
		)
			return ErrorSender.sendError(403, {
				type: 'error',
				errorCode: 'jsp.document_expired',
				message: 'This file has been expired and will be deleted soon'
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
			return ErrorSender.sendError(404, {
				type: 'error',
				errorCode: 'jsp.file_not_found',
				message: 'The requested file does not exist'
			});

		const buffer = Buffer.from(newBody as ArrayBuffer);

		if (!DataValidator.isLengthBetweenLimits(buffer, 1, maxDocLength))
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: 'jsp.invalid_file_length',
				message: 'The document data its is too big or is empty'
			});

		const doc = await DocumentManager.read(file);

		if (doc.secret && doc.secret !== secret)
			return ErrorSender.sendError(403, {
				type: 'error',
				errorCode: 'jsp.invalid_secret',
				message: 'Invalid secret provided'
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

		if (!DataValidator.isLengthBetweenLimits(buffer, 1, maxDocLength))
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: 'jsp.invalid_file_length',
				message: 'The document data its is too big or is empty'
			});

		const selectedKey = await createKey();

		const secret = selectedSecret || createSecret();

		if (!DataValidator.isLengthBetweenLimits(secret, 1, 254))
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: 'jsp.invalid_secret_length',
				message: 'The provided secret is too big or is empty'
			});

		if (!DataValidator.isLengthBetweenLimits(password, 0, 254))
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: 'jsp.invalid_password_length',
				message: 'The provided password is too big'
			});

		// FIXME: Encrypt password?
		const newDoc: DocumentDataStruct = {
			rawFileData: buffer,
			secret: secret,
			deletionTime: BigInt(0),
			password: password
		};

		await DocumentManager.write(basePath + selectedKey, newDoc);

		return { key: selectedKey, secret: selectedSecret };
	}

	static async handleRemove({ id, secret }: { id: string; secret: string }) {
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

		if (doc.secret && doc.secret !== secret)
			return ErrorSender.sendError(403, {
				type: 'error',
				errorCode: 'jsp.invalid_secret',
				message: 'Invalid secret provided'
			});

		// FIXME: Use bun

		await unlink(basePath + id);

		return { message: 'File removed successfully' };
	}
}

function getUnixTimespanSecconds() {
	return Math.floor(Date.now() / 1000);
}
