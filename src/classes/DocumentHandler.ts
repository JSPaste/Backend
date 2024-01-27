import { unlink } from 'node:fs/promises';
import { ErrorSender } from './ErrorSender.ts';
import { DataValidator } from './DataValidator';
import { DocumentManager } from './DocumentManager';
import { createKey, createSecret } from '../utils/createKey.ts';
import type { DocumentDataStruct } from '../structures/documentStruct.ts';
import {
	JSPErrorCode,
	basePath,
	defaultDocumentLifetime,
	maxDocLength
} from '../utils/constants.ts';

export interface AccessResponse {
	key: string;
	data: string;
}

export class DocumentHandler {
	static async handleAccess({ id, password }: { id: string; password?: string }) {
		if (!DataValidator.isAlphanumeric(id))
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: JSPErrorCode.invalidInput,
				message: 'Invalid ID provided'
			});

		const file = Bun.file(basePath + id);

		const fileExists = await file.exists();

		if (!fileExists)
			return ErrorSender.sendError(404, {
				type: 'error',
				errorCode: JSPErrorCode.fileNotFound,
				message: 'The requested file does not exist'
			});

		const doc = await DocumentManager.read(file);

		if (doc.password && doc.password !== password)
			return ErrorSender.sendError(401, {
				type: 'error',
				errorCode: JSPErrorCode.invalidPassword,
				message: 'This file needs credentials, however no credentials were provided'
			});

		if (doc.expireTimestamp && doc.expireTimestamp > 0 && doc.expireTimestamp <= Date.now()) {
			await unlink(basePath + id).catch(() => null);

			return ErrorSender.sendError(404, {
				type: 'error',
				errorCode: JSPErrorCode.fileNotFound,
				message: 'The requested file does not exist'
			});
		}

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
				errorCode: JSPErrorCode.invalidInput,
				message: 'Invalid ID provided'
			});

		const file = Bun.file(basePath + id);

		const fileExists = await file.exists();

		if (!fileExists)
			return ErrorSender.sendError(404, {
				type: 'error',
				errorCode: JSPErrorCode.fileNotFound,
				message: 'The requested file does not exist'
			});

		const buffer = Buffer.from(newBody as ArrayBuffer);

		if (!DataValidator.isLengthBetweenLimits(buffer, 1, maxDocLength))
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: JSPErrorCode.invalidFileLength,
				message: 'The document data its is too big or is empty'
			});

		const doc = await DocumentManager.read(file);

		if (doc.secret && doc.secret !== secret)
			return ErrorSender.sendError(403, {
				type: 'error',
				errorCode: JSPErrorCode.invalidSecret,
				message: 'Invalid secret provided'
			});

		doc.rawFileData = buffer;

		await DocumentManager.write(basePath + id, doc);

		return { message: 'File updated successfully' };
	}

	static async handlePublish({
		body,
		selectedSecret,
		lifetime,
		password
	}: {
		body: any;
		selectedSecret?: string;
		lifetime?: number;
		password?: string;
	}) {
		const buffer = Buffer.from(body as ArrayBuffer);

		if (!DataValidator.isLengthBetweenLimits(buffer, 1, maxDocLength))
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: JSPErrorCode.invalidFileLength,
				message: 'The document data its is too big or is empty'
			});

		const secret = selectedSecret || createSecret();

		if (!DataValidator.isLengthBetweenLimits(secret, 1, 254))
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: JSPErrorCode.invalidSecretLength,
				message: 'The provided secret is too big or is empty'
			});

		if (!DataValidator.isLengthBetweenLimits(password, 0, 254)) {
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: JSPErrorCode.invalidPasswordLength,
				message: 'The provided password is too big'
			});
		}

		// Make the document permanent if the value exceeds 5 years
		if (lifetime ?? 0 > 157_784_760) lifetime = 0;

		const newDoc: DocumentDataStruct = {
			rawFileData: buffer,
			secret: secret,
			expireTimestamp:
				(lifetime ?? defaultDocumentLifetime * 1000) > 0
					? BigInt(Date.now() + (lifetime ?? defaultDocumentLifetime * 1000))
					: undefined,
			// FIXME: Encrypt password?
			password: password
		};

		const selectedKey = await createKey();

		await DocumentManager.write(basePath + selectedKey, newDoc);

		return { key: selectedKey, secret: secret };
	}

	static async handleRemove({ id, secret }: { id: string; secret: string }) {
		if (!DataValidator.isAlphanumeric(id))
			return ErrorSender.sendError(400, {
				type: 'error',
				errorCode: JSPErrorCode.invalidInput,
				message: 'Invalid ID provided'
			});

		const file = Bun.file(basePath + id);

		const fileExists = await file.exists();

		if (!fileExists)
			return ErrorSender.sendError(404, {
				type: 'error',
				errorCode: JSPErrorCode.fileNotFound,
				message: 'The requested file does not exist'
			});

		const doc = await DocumentManager.read(file);

		if (doc.secret && doc.secret !== secret)
			return ErrorSender.sendError(403, {
				type: 'error',
				errorCode: JSPErrorCode.invalidSecret,
				message: 'Invalid secret provided'
			});

		// FIXME: Use bun

		await unlink(basePath + id);

		return { message: 'File removed successfully' };
	}
}
