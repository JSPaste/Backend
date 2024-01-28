import { unlink } from 'node:fs/promises';
import { DataValidator } from './DataValidator';
import { DocumentManager } from './DocumentManager';
import { createKey, createSecret } from '../utils/createKey.ts';
import type { DocumentDataStruct } from '../structures/documentStruct.ts';
import {
	APIVersions,
	JSPErrorCode,
	basePath,
	defaultDocumentLifetime,
	maxDocLength,
	viewDocumentPath
} from '../utils/constants.ts';
import { ErrorSender } from './ErrorSender.ts';

export class DocumentHandler {
	static async handleAccess({
		errorSender,
		id,
		password
	}: {
		errorSender: ErrorSender;
		id: string;
		password?: string;
	}) {
		if (!DataValidator.isAlphanumeric(id))
			return errorSender.sendError(400, {
				type: 'error',
				errorCode: JSPErrorCode.inputInvalid,
				message: 'The provided document ID is not alphanumeric'
			});

		const file = Bun.file(basePath + id);

		const fileExists = await file.exists();

		if (!fileExists)
			return errorSender.sendError(404, {
				type: 'error',
				errorCode: JSPErrorCode.documentNotFound,
				message: 'The requested file does not exist'
			});

		const doc = await DocumentManager.read(file);

		if (doc.expireTimestamp && doc.expireTimestamp > 0 && doc.expireTimestamp <= Date.now()) {
			await unlink(basePath + id).catch(() => null);

			return errorSender.sendError(404, {
				type: 'error',
				errorCode: JSPErrorCode.documentNotFound,
				message: 'The requested file does not exist'
			});
		}

		if (doc.password && !password)
			return errorSender.sendError(401, {
				type: 'error',
				errorCode: JSPErrorCode.documentPasswordNeeded,
				message: 'This document requires credentials, however none were provided.'
			});

		if (doc.password && doc.password !== password)
			return errorSender.sendError(403, {
				type: 'error',
				errorCode: JSPErrorCode.documentInvalidPassword,
				message: 'Invalid credentials provided for the document.'
			});

		const data = new TextDecoder().decode(doc.rawFileData);

		return {
			key: id,
			data
		};
	}

	static async handleRawAccess({
		errorSender,
		id,
		password
	}: {
		errorSender: ErrorSender;
		id: string;
		password?: string;
	}) {
		return DocumentHandler.handleAccess({ errorSender, id, password }).then((res) =>
			ErrorSender.isJSPError(res) ? res : res.data
		);
	}

	static async handleEdit({
		errorSender,
		id,
		newBody,
		secret
	}: {
		errorSender: ErrorSender;
		id: string;
		newBody: any;
		secret?: string;
	}) {
		if (!DataValidator.isAlphanumeric(id))
			return errorSender.sendError(400, {
				type: 'error',
				errorCode: JSPErrorCode.inputInvalid,
				message: 'The provided document ID is not alphanumeric'
			});

		const file = Bun.file(basePath + id);

		const fileExists = await file.exists();

		if (!fileExists)
			return errorSender.sendError(404, {
				type: 'error',
				errorCode: JSPErrorCode.documentNotFound,
				message: 'The requested file does not exist'
			});

		const buffer = Buffer.from(newBody as ArrayBuffer);

		if (!DataValidator.isLengthBetweenLimits(buffer, 1, maxDocLength))
			return errorSender.sendError(400, {
				type: 'error',
				errorCode: JSPErrorCode.documentInvalidLength,
				message: 'The document data length is invalid'
			});

		const doc = await DocumentManager.read(file);

		if (doc.secret && doc.secret !== secret)
			return errorSender.sendError(403, {
				type: 'error',
				errorCode: JSPErrorCode.documentInvalidSecret,
				message: 'Invalid secret provided'
			});

		doc.rawFileData = buffer;

		await DocumentManager.write(basePath + id, doc);

		return { message: 'File updated successfully' };
	}

	static async handleExists({ errorSender, id }: { errorSender: ErrorSender; id: string }) {
		if (!DataValidator.isAlphanumeric(id))
			return errorSender.sendError(400, {
				type: 'error',
				errorCode: JSPErrorCode.inputInvalid,
				message: 'The provided document ID is not alphanumeric'
			});

		const file = Bun.file(basePath + id);

		const fileExists = await file.exists();

		return fileExists;
	}

	static async handlePublish(
		{
			errorSender,
			body,
			selectedSecret,
			lifetime,
			password
		}: {
			errorSender: ErrorSender;
			body: any;
			selectedSecret?: string;
			lifetime?: number;
			password?: string;
		},
		version: APIVersions
	) {
		const buffer = Buffer.from(body as ArrayBuffer);

		if (!DataValidator.isLengthBetweenLimits(buffer, 1, maxDocLength))
			return errorSender.sendError(400, {
				type: 'error',
				errorCode: JSPErrorCode.documentInvalidLength,
				message: 'The document data length is invalid'
			});

		const secret = selectedSecret || createSecret();

		if (!DataValidator.isStringLengthBetweenLimits(secret ?? '', 1, 254))
			return errorSender.sendError(400, {
				type: 'error',
				errorCode: JSPErrorCode.documentInvalidSecretLength,
				message: 'The provided secret length is invalid'
			});

		if (password && !DataValidator.isStringLengthBetweenLimits(password, 0, 254))
			return errorSender.sendError(400, {
				type: 'error',
				errorCode: JSPErrorCode.documentInvalidPasswordLength,
				message: 'The provided password length is invalid'
			});

		// Make the document permanent if the value exceeds 5 years
		if ((lifetime ?? 0) > 157_784_760) lifetime = 0;

		const expireTimestamp =
			(lifetime ?? defaultDocumentLifetime) * 1000 > 0
				? Date.now() + (lifetime ?? defaultDocumentLifetime) * 1000
				: undefined;

		const newDoc: DocumentDataStruct = {
			rawFileData: buffer,
			secret,
			expireTimestamp:
				typeof expireTimestamp === 'number' ? BigInt(expireTimestamp) : undefined,
			password
		};

		const selectedKey = await createKey();

		await DocumentManager.write(basePath + selectedKey, newDoc);

		switch (version) {
			case APIVersions.v1:
				return { key: selectedKey, secret };
			case APIVersions.v2:
				return {
					key: selectedKey,
					secret,
					url: viewDocumentPath + selectedKey,
					expireTimestamp
				};
		}
	}

	static async handleRemove({
		errorSender,
		id,
		secret
	}: {
		errorSender: ErrorSender;
		id: string;
		secret: string;
	}) {
		if (!DataValidator.isAlphanumeric(id))
			return errorSender.sendError(400, {
				type: 'error',
				errorCode: JSPErrorCode.inputInvalid,
				message: 'The provided document ID is not alphanumeric'
			});

		const file = Bun.file(basePath + id);

		const fileExists = await file.exists();

		if (!fileExists)
			return errorSender.sendError(404, {
				type: 'error',
				errorCode: JSPErrorCode.documentNotFound,
				message: 'The requested file does not exist'
			});

		const doc = await DocumentManager.read(file);

		if (doc.secret && doc.secret !== secret)
			return errorSender.sendError(403, {
				type: 'error',
				errorCode: JSPErrorCode.documentInvalidSecret,
				message: 'Invalid secret provided'
			});

		// FIXME: Use bun
		await unlink(basePath + id);

		return { message: 'File removed successfully' };
	}
}
