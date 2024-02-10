import { unlink } from 'node:fs/promises';
import { ValidatorUtils } from '../utils/ValidatorUtils.ts';
import { DocumentManager } from './DocumentManager';
import type { DocumentDataStruct } from '../structures/documentStruct.ts';
import {
	basePath,
	defaultDocumentLifetime,
	JSPErrorCode,
	JSPErrorMessage,
	maxDocLength,
	ServerVersion,
	viewDocumentPath,
	type Range
} from '../utils/constants.ts';
import { ErrorSender } from './ErrorSender.ts';
import { StringUtils } from '../utils/StringUtils.ts';

interface HandleAccess {
	errorSender: ErrorSender;
	key: string;
	password?: string;
	raw?: boolean;
}

interface HandleEdit {
	errorSender: ErrorSender;
	key: string;
	newBody: any;
	secret?: string;
}

interface HandleExists {
	errorSender: ErrorSender;
	key: string;
}

interface HandlePublish {
	errorSender: ErrorSender;
	body: any;
	selectedSecret?: string;
	lifetime?: number;
	password?: string;
	selectedKeyLength?: number;
	selectedKey?: string;
}

interface HandleRemove {
	errorSender: ErrorSender;
	key: string;
	secret: string;
}

interface HandleGetDocument {
	errorSender: ErrorSender;
	key: string;
	password?: string;
}

export class DocumentHandler {
	public static async handleAccess(
		{ errorSender, key, password, raw = false }: HandleAccess,
		version: ServerVersion
	) {
		const res = await DocumentHandler.handleGetDocument({ errorSender, key: key, password });
		if (ErrorSender.isJSPError(res)) return res;

		if (raw) return new Response(res.rawFileData);

		const data = new TextDecoder().decode(res.rawFileData);

		switch (version) {
			case ServerVersion.v1:
				return { key, data };

			case ServerVersion.v2:
				return {
					key,
					data,
					url: viewDocumentPath + key,
					expirationTimestamp: res.expirationTimestamp ? Number(res.expirationTimestamp) : undefined
				};
		}
	}

	public static async handleEdit({ errorSender, key, newBody, secret }: HandleEdit) {
		if (!ValidatorUtils.isStringLengthBetweenLimits(key, 1, 255) || !ValidatorUtils.isAlphanumeric(key))
			return errorSender.sendError(400, JSPErrorMessage[JSPErrorCode.inputInvalid]);

		const file = Bun.file(basePath + key);
		const fileExists = await file.exists();

		if (!fileExists) return errorSender.sendError(404, JSPErrorMessage[JSPErrorCode.documentNotFound]);

		const buffer = Buffer.from(newBody as ArrayBuffer);

		if (!ValidatorUtils.isLengthBetweenLimits(buffer, 1, maxDocLength))
			return errorSender.sendError(400, JSPErrorMessage[JSPErrorCode.documentInvalidLength]);

		const doc = await DocumentManager.read(file);

		if (doc.secret && doc.secret !== secret)
			return errorSender.sendError(403, JSPErrorMessage[JSPErrorCode.documentInvalidSecret]);

		doc.rawFileData = buffer;

		return {
			edited: await DocumentManager.write(basePath + key, doc)
				.then(() => true)
				.catch(() => false)
		};
	}

	public static async handleExists({ errorSender, key }: HandleExists) {
		if (!ValidatorUtils.isStringLengthBetweenLimits(key, 1, 255) || !ValidatorUtils.isAlphanumeric(key))
			return errorSender.sendError(400, JSPErrorMessage[JSPErrorCode.inputInvalid]);

		return await Bun.file(basePath + key).exists();
	}

	public static async handlePublish(
		{ errorSender, body, selectedSecret, lifetime, password, selectedKeyLength, selectedKey }: HandlePublish,
		version: ServerVersion
	) {
		const buffer = Buffer.from(body as ArrayBuffer);

		if (!ValidatorUtils.isLengthBetweenLimits(buffer, 1, maxDocLength))
			return errorSender.sendError(400, JSPErrorMessage[JSPErrorCode.documentInvalidLength]);

		const secret = selectedSecret || StringUtils.createSecret();

		if (!ValidatorUtils.isStringLengthBetweenLimits(secret || '', 1, 255))
			return errorSender.sendError(400, JSPErrorMessage[JSPErrorCode.documentInvalidSecretLength]);

		if (
			selectedKey &&
			(!ValidatorUtils.isStringLengthBetweenLimits(selectedKey, 2, 32) ||
				!ValidatorUtils.isAlphanumeric(selectedKey))
		)
			return errorSender.sendError(400, JSPErrorMessage[JSPErrorCode.inputInvalid]);

		if (selectedKeyLength && (selectedKeyLength > 32 || selectedKeyLength < 2))
			return errorSender.sendError(400, JSPErrorMessage[JSPErrorCode.documentInvalidKeyLength]);

		if (password && !ValidatorUtils.isStringLengthBetweenLimits(password, 0, 255))
			return errorSender.sendError(400, JSPErrorMessage[JSPErrorCode.documentInvalidPasswordLength]);

		lifetime = lifetime ?? defaultDocumentLifetime;

		// Make the document permanent if the value exceeds 5 years
		if (lifetime > 157_784_760) lifetime = 0;

		const msLifetime = lifetime * 1000;
		const expirationTimestamp = msLifetime > 0 ? BigInt(Date.now() + msLifetime) : undefined;

		const newDoc: DocumentDataStruct = {
			rawFileData: buffer,
			secret,
			expirationTimestamp,
			password
		};

		const key = selectedKey || (await StringUtils.createKey((selectedKeyLength as Range<2, 32>) || 8));

		if (selectedKey && (await StringUtils.keyExists(key)))
			return errorSender.sendError(400, JSPErrorMessage[JSPErrorCode.documentKeyAlreadyExists]);

		await DocumentManager.write(basePath + key, newDoc);

		switch (version) {
			case ServerVersion.v1:
				return { key, secret };

			case ServerVersion.v2:
				return {
					key,
					secret,
					url: viewDocumentPath + key,
					expirationTimestamp: Number(expirationTimestamp ?? 0)
				};
		}
	}

	public static async handleRemove({ errorSender, key, secret }: HandleRemove) {
		if (!ValidatorUtils.isStringLengthBetweenLimits(key, 1, 255) || !ValidatorUtils.isAlphanumeric(key))
			return errorSender.sendError(400, JSPErrorMessage[JSPErrorCode.inputInvalid]);

		const file = Bun.file(basePath + key);
		const fileExists = await file.exists();

		if (!fileExists) return errorSender.sendError(404, JSPErrorMessage[JSPErrorCode.documentNotFound]);

		const doc = await DocumentManager.read(file);

		if (doc.secret && doc.secret !== secret)
			return errorSender.sendError(403, JSPErrorMessage[JSPErrorCode.documentInvalidSecret]);

		return {
			// TODO: Use optimized Bun.unlink when available -> https://bun.sh/docs/api/file-io#writing-files-bun-write
			removed: await unlink(basePath + key)
				.then(() => true)
				.catch(() => false)
		};
	}

	private static async handleGetDocument({ errorSender, key, password }: HandleGetDocument) {
		if (!ValidatorUtils.isStringLengthBetweenLimits(key, 1, 255) || !ValidatorUtils.isAlphanumeric(key))
			return errorSender.sendError(400, JSPErrorMessage[JSPErrorCode.inputInvalid]);

		const file = Bun.file(basePath + key);
		const fileExists = await file.exists();
		const doc = fileExists && (await DocumentManager.read(file));

		if (!doc || (doc.expirationTimestamp && doc.expirationTimestamp > 0 && doc.expirationTimestamp < Date.now())) {
			// TODO: Use optimized Bun.unlink when available -> https://bun.sh/docs/api/file-io#writing-files-bun-write
			if (fileExists) await unlink(basePath + key).catch(() => null);

			return errorSender.sendError(404, JSPErrorMessage[JSPErrorCode.documentNotFound]);
		}

		if (doc.password && !password)
			return errorSender.sendError(401, JSPErrorMessage[JSPErrorCode.documentPasswordNeeded]);

		if (doc.password && doc.password !== password)
			return errorSender.sendError(403, JSPErrorMessage[JSPErrorCode.documentInvalidPassword]);

		return doc;
	}
}
