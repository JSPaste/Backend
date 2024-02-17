import { unlink } from 'node:fs/promises';
import { ValidatorUtils } from '../utils/ValidatorUtils.ts';
import { DocumentManager } from './DocumentManager.ts';
import {
	basePath,
	defaultDocumentLifetime,
	JSPErrorMessage,
	maxDocLength,
	type Range,
	serverConfig
} from '../utils/constants.ts';
import { StringUtils } from '../utils/StringUtils.ts';
import type { IDocumentDataStruct } from '../structures/Structures';
import type {
	HandleAccess,
	HandleEdit,
	HandleExists,
	HandleGetDocument,
	HandlePublish,
	HandleRemove
} from '../types/DocumentHandler.ts';
import { ServerVersion } from '../types/Server.ts';
import { ErrorHandler } from './ErrorHandler.ts';
import { JSPErrorCode } from '../types/ErrorHandler.ts';

export class DocumentHandler {
	public static async handleAccess(set: any, { key, password, raw = false }: HandleAccess, version: ServerVersion) {
		const res = await DocumentHandler.handleGetDocument(set, { key: key, password });
		if (ErrorHandler.isJSPError(res)) return res;

		if (raw) return new Response(res.rawFileData);

		const data = new TextDecoder().decode(res.rawFileData);

		switch (version) {
			case ServerVersion.v1:
				return { key, data };

			case ServerVersion.v2:
				return {
					key,
					data,
					url: (serverConfig.tls ? 'https://' : 'http://').concat(serverConfig.domain + '/') + key,
					expirationTimestamp: res.expirationTimestamp ? Number(res.expirationTimestamp) : undefined
				};
		}
	}

	public static async handleEdit(set: any, { key, newBody, secret }: HandleEdit) {
		if (!ValidatorUtils.isStringLengthBetweenLimits(key, 1, 255) || !ValidatorUtils.isAlphanumeric(key))
			return ErrorHandler.send(set, 400, JSPErrorMessage[JSPErrorCode.inputInvalid]);

		const file = Bun.file(basePath + key);
		const fileExists = await file.exists();

		if (!fileExists) return ErrorHandler.send(set, 404, JSPErrorMessage[JSPErrorCode.documentNotFound]);

		const buffer = Buffer.from(newBody as ArrayBuffer);

		if (!ValidatorUtils.isLengthBetweenLimits(buffer, 1, maxDocLength))
			return ErrorHandler.send(set, 400, JSPErrorMessage[JSPErrorCode.documentInvalidLength]);

		const doc = await DocumentManager.read(file);

		if (doc.secret && doc.secret !== secret)
			return ErrorHandler.send(set, 403, JSPErrorMessage[JSPErrorCode.documentInvalidSecret]);

		doc.rawFileData = buffer;

		return {
			edited: await DocumentManager.write(basePath + key, doc)
				.then(() => true)
				.catch(() => false)
		};
	}

	public static async handleExists(set: any, { key }: HandleExists) {
		if (!ValidatorUtils.isStringLengthBetweenLimits(key, 1, 255) || !ValidatorUtils.isAlphanumeric(key))
			return ErrorHandler.send(set, 400, JSPErrorMessage[JSPErrorCode.inputInvalid]);

		return await Bun.file(basePath + key).exists();
	}

	public static async handlePublish(
		set: any,
		{ body, selectedSecret, lifetime, password, selectedKeyLength, selectedKey }: HandlePublish,
		version: ServerVersion
	) {
		const buffer = Buffer.from(body as ArrayBuffer);

		if (!ValidatorUtils.isLengthBetweenLimits(buffer, 1, maxDocLength))
			return ErrorHandler.send(set, 400, JSPErrorMessage[JSPErrorCode.documentInvalidLength]);

		const secret = selectedSecret || StringUtils.createSecret();

		if (!ValidatorUtils.isStringLengthBetweenLimits(secret || '', 1, 255))
			return ErrorHandler.send(set, 400, JSPErrorMessage[JSPErrorCode.documentInvalidSecretLength]);

		if (
			selectedKey &&
			(!ValidatorUtils.isStringLengthBetweenLimits(selectedKey, 2, 32) ||
				!ValidatorUtils.isAlphanumeric(selectedKey))
		)
			return ErrorHandler.send(set, 400, JSPErrorMessage[JSPErrorCode.inputInvalid]);

		if (selectedKeyLength && (selectedKeyLength > 32 || selectedKeyLength < 2))
			return ErrorHandler.send(set, 400, JSPErrorMessage[JSPErrorCode.documentInvalidKeyLength]);

		if (password && !ValidatorUtils.isStringLengthBetweenLimits(password, 0, 255))
			return ErrorHandler.send(set, 400, JSPErrorMessage[JSPErrorCode.documentInvalidPasswordLength]);

		lifetime = lifetime ?? defaultDocumentLifetime;

		// Make the document permanent if the value exceeds 5 years
		if (lifetime > 157_784_760) lifetime = 0;

		const msLifetime = lifetime * 1000;
		const expirationTimestamp = msLifetime > 0 ? BigInt(Date.now() + msLifetime) : undefined;

		const newDoc: IDocumentDataStruct = {
			rawFileData: buffer,
			secret,
			expirationTimestamp,
			password
		};

		const key = selectedKey || (await StringUtils.createKey((selectedKeyLength as Range<2, 32>) || 8));

		if (selectedKey && (await StringUtils.keyExists(key)))
			return ErrorHandler.send(set, 400, JSPErrorMessage[JSPErrorCode.documentKeyAlreadyExists]);

		await DocumentManager.write(basePath + key, newDoc);

		switch (version) {
			case ServerVersion.v1:
				return { key, secret };

			case ServerVersion.v2:
				return {
					key,
					secret,
					url: (serverConfig.tls ? 'https://' : 'http://').concat(serverConfig.domain + '/') + key,
					expirationTimestamp: Number(expirationTimestamp ?? 0)
				};
		}
	}

	public static async handleRemove(set: any, { key, secret }: HandleRemove) {
		if (!ValidatorUtils.isStringLengthBetweenLimits(key, 1, 255) || !ValidatorUtils.isAlphanumeric(key))
			return ErrorHandler.send(set, 400, JSPErrorMessage[JSPErrorCode.inputInvalid]);

		const file = Bun.file(basePath + key);
		const fileExists = await file.exists();

		if (!fileExists) return ErrorHandler.send(set, 404, JSPErrorMessage[JSPErrorCode.documentNotFound]);

		const doc = await DocumentManager.read(file);

		if (doc.secret && doc.secret !== secret)
			return ErrorHandler.send(set, 403, JSPErrorMessage[JSPErrorCode.documentInvalidSecret]);

		return {
			// TODO: Use optimized Bun.unlink when available -> https://bun.sh/docs/api/file-io#writing-files-bun-write
			removed: await unlink(basePath + key)
				.then(() => true)
				.catch(() => false)
		};
	}

	private static async handleGetDocument(set: any, { key, password }: HandleGetDocument) {
		if (!ValidatorUtils.isStringLengthBetweenLimits(key, 1, 255) || !ValidatorUtils.isAlphanumeric(key))
			return ErrorHandler.send(set, 400, JSPErrorMessage[JSPErrorCode.inputInvalid]);

		const file = Bun.file(basePath + key);
		const fileExists = await file.exists();
		const doc = fileExists && (await DocumentManager.read(file));

		if (!doc || (doc.expirationTimestamp && doc.expirationTimestamp > 0 && doc.expirationTimestamp < Date.now())) {
			// TODO: Use optimized Bun.unlink when available -> https://bun.sh/docs/api/file-io#writing-files-bun-write
			if (fileExists) await unlink(basePath + key).catch(() => null);

			return ErrorHandler.send(set, 404, JSPErrorMessage[JSPErrorCode.documentNotFound]);
		}

		if (doc.password && !password)
			return ErrorHandler.send(set, 401, JSPErrorMessage[JSPErrorCode.documentPasswordNeeded]);

		if (doc.password && doc.password !== password)
			return ErrorHandler.send(set, 403, JSPErrorMessage[JSPErrorCode.documentInvalidPassword]);

		return doc;
	}
}
