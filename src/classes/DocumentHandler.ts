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
	static async handleAccess(
		{
			errorSender,
			key,
			password
		}: {
			errorSender: ErrorSender;
			key: string;
			password?: string;
		},
		version: APIVersions
	) {
		return DocumentHandler.handleAccessCore({ errorSender, key: key, password }, version).then(
			(res) => {
				if (ErrorSender.isJSPError(res)) {
					return res;
				}

				const data = new TextDecoder().decode(res.rawFileData);

				switch (version) {
					case APIVersions.v1:
						return {
							key,
							data
						};
					case APIVersions.v2:
						return {
							key,
							data,
							url: viewDocumentPath + key,
							expirationTimestamp: Number(res.expirationTimestamp)
						};
				}
			}
		);
	}

	static async handleRawAccess(
		{
			errorSender,
			key,
			password
		}: {
			errorSender: ErrorSender;
			key: string;
			password?: string;
		},
		version: APIVersions
	) {
		return DocumentHandler.handleAccessCore({ errorSender, key: key, password }, version).then(
			(res) => (ErrorSender.isJSPError(res) ? res : new Response(res.rawFileData))
		);
	}

	static async handleAccessCore(
		{
			errorSender,
			key,
			password
		}: {
			errorSender: ErrorSender;
			key: string;
			password?: string;
		},
		version: APIVersions
	) {
		if (!DataValidator.isAlphanumeric(key))
			return errorSender.sendError(400, {
				type: 'error',
				errorCode: JSPErrorCode.inputInvalid,
				message: 'The provided document key is not alphanumeric'
			});

		const file = Bun.file(basePath + key);

		const fileExists = await file.exists();

		const doc = fileExists && (await DocumentManager.read(file));

		if (
			!doc ||
			(doc.expirationTimestamp &&
				doc.expirationTimestamp > 0 &&
				doc.expirationTimestamp <= Date.now())
		) {
			if (fileExists) await unlink(basePath + key).catch(() => null);

			return errorSender.sendError(404, {
				type: 'error',
				errorCode: JSPErrorCode.documentNotFound,
				message: 'The requested document does not exist'
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

		return doc;
	}

	static async handleEdit({
		errorSender,
		key,
		newBody,
		secret
	}: {
		errorSender: ErrorSender;
		key: string;
		newBody: any;
		secret?: string;
	}) {
		if (!DataValidator.isAlphanumeric(key))
			return errorSender.sendError(400, {
				type: 'error',
				errorCode: JSPErrorCode.inputInvalid,
				message: 'The provided document ID is not alphanumeric'
			});

		const file = Bun.file(basePath + key);

		const fileExists = await file.exists();

		if (!fileExists)
			return errorSender.sendError(404, {
				type: 'error',
				errorCode: JSPErrorCode.documentNotFound,
				message: 'The requested document does not exist'
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

		const edited = await DocumentManager.write(basePath + key, doc)
			.then(() => true)
			.catch(() => false);

		return { edited };
	}

	static async handleExists({ errorSender, key }: { errorSender: ErrorSender; key: string }) {
		if (!DataValidator.isAlphanumeric(key))
			return errorSender.sendError(400, {
				type: 'error',
				errorCode: JSPErrorCode.inputInvalid,
				message: 'The provided document ID is not alphanumeric'
			});

		const file = Bun.file(basePath + key);

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

		const parsedExpirationTimestamp =
			(lifetime ?? defaultDocumentLifetime) * 1000 > 0
				? Date.now() + (lifetime ?? defaultDocumentLifetime) * 1000
				: undefined;

		const expirationTimestamp =
			typeof parsedExpirationTimestamp === 'number'
				? BigInt(parsedExpirationTimestamp)
				: undefined;

		const newDoc: DocumentDataStruct = {
			rawFileData: buffer,
			secret,
			expirationTimestamp,
			password
		};

		const key = await createKey();

		await DocumentManager.write(basePath + key, newDoc);

		switch (version) {
			case APIVersions.v1:
				return { key, secret };
			case APIVersions.v2:
				return {
					key,
					secret,
					url: viewDocumentPath + key,
					expirationTimestamp: parsedExpirationTimestamp
				};
		}
	}

	static async handleRemove({
		errorSender,
		key,
		secret
	}: {
		errorSender: ErrorSender;
		key: string;
		secret: string;
	}) {
		if (!DataValidator.isAlphanumeric(key))
			return errorSender.sendError(400, {
				type: 'error',
				errorCode: JSPErrorCode.inputInvalid,
				message: 'The provided document ID is not alphanumeric'
			});

		const file = Bun.file(basePath + key);

		const fileExists = await file.exists();

		if (!fileExists)
			return errorSender.sendError(404, {
				type: 'error',
				errorCode: JSPErrorCode.documentNotFound,
				message: 'The requested document does not exist'
			});

		const doc = await DocumentManager.read(file);

		if (doc.secret && doc.secret !== secret)
			return errorSender.sendError(403, {
				type: 'error',
				errorCode: JSPErrorCode.documentInvalidSecret,
				message: 'Invalid secret provided'
			});

		// FIXME: Use bun
		const removed = await unlink(basePath + key)
			.then(() => true)
			.catch(() => false);

		return { removed };
	}
}
