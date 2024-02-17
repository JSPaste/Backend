import { unlink } from 'node:fs/promises';
import { ValidatorUtils } from '../utils/ValidatorUtils.ts';
import { DocumentManager } from './DocumentManager.ts';
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
import { JSPError } from './JSPError.ts';
import { Server } from './Server.ts';
import type { Range } from '../types/Range.ts';
import { ErrorCode } from '../types/JSPError.ts';

export class DocumentHandler {
	public static async handleAccess(set: any, { key, password, raw = false }: HandleAccess, version: ServerVersion) {
		const res = await DocumentHandler.handleGetDocument(set, { key: key, password });
		if (ValidatorUtils.isJSPError(res)) return res;

		if (raw) return new Response(res.rawFileData);

		const data = new TextDecoder().decode(res.rawFileData);

		switch (version) {
			case ServerVersion.v1:
				return { key, data };

			case ServerVersion.v2:
				return {
					key,
					data,
					url: (Server.config.tls ? 'https://' : 'http://').concat(Server.config.domain + '/') + key,
					expirationTimestamp: res.expirationTimestamp ? Number(res.expirationTimestamp) : undefined
				};
		}
	}

	public static async handleEdit(set: any, { key, newBody, secret }: HandleEdit) {
		if (!ValidatorUtils.isStringLengthBetweenLimits(key, 1, 255) || !ValidatorUtils.isAlphanumeric(key))
			return JSPError.send(set, 400, JSPError.message[ErrorCode.inputInvalid]);

		const file = Bun.file(Server.basePath + key);
		const fileExists = await file.exists();

		if (!fileExists) return JSPError.send(set, 404, JSPError.message[ErrorCode.documentNotFound]);

		const buffer = Buffer.from(newBody as ArrayBuffer);

		if (!ValidatorUtils.isLengthBetweenLimits(buffer, 1, Server.maxDocLength))
			return JSPError.send(set, 400, JSPError.message[ErrorCode.documentInvalidLength]);

		const doc = await DocumentManager.read(file);

		if (doc.secret && doc.secret !== secret)
			return JSPError.send(set, 403, JSPError.message[ErrorCode.documentInvalidSecret]);

		doc.rawFileData = buffer;

		return {
			edited: await DocumentManager.write(Server.basePath + key, doc)
				.then(() => true)
				.catch(() => false)
		};
	}

	public static async handleExists(set: any, { key }: HandleExists) {
		if (!ValidatorUtils.isStringLengthBetweenLimits(key, 1, 255) || !ValidatorUtils.isAlphanumeric(key))
			return JSPError.send(set, 400, JSPError.message[ErrorCode.inputInvalid]);

		return await Bun.file(Server.basePath + key).exists();
	}

	public static async handlePublish(
		set: any,
		{ body, selectedSecret, lifetime, password, selectedKeyLength, selectedKey }: HandlePublish,
		version: ServerVersion
	) {
		const buffer = Buffer.from(body as ArrayBuffer);

		if (!ValidatorUtils.isLengthBetweenLimits(buffer, 1, Server.maxDocLength))
			return JSPError.send(set, 400, JSPError.message[ErrorCode.documentInvalidLength]);

		const secret = selectedSecret || StringUtils.createSecret();

		if (!ValidatorUtils.isStringLengthBetweenLimits(secret || '', 1, 255))
			return JSPError.send(set, 400, JSPError.message[ErrorCode.documentInvalidSecretLength]);

		if (
			selectedKey &&
			(!ValidatorUtils.isStringLengthBetweenLimits(selectedKey, 2, 32) ||
				!ValidatorUtils.isAlphanumeric(selectedKey))
		)
			return JSPError.send(set, 400, JSPError.message[ErrorCode.inputInvalid]);

		if (selectedKeyLength && (selectedKeyLength > 32 || selectedKeyLength < 2))
			return JSPError.send(set, 400, JSPError.message[ErrorCode.documentInvalidKeyLength]);

		if (password && !ValidatorUtils.isStringLengthBetweenLimits(password, 0, 255))
			return JSPError.send(set, 400, JSPError.message[ErrorCode.documentInvalidPasswordLength]);

		lifetime = lifetime ?? Server.defaultDocumentLifetime;

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
			return JSPError.send(set, 400, JSPError.message[ErrorCode.documentKeyAlreadyExists]);

		await DocumentManager.write(Server.basePath + key, newDoc);

		switch (version) {
			case ServerVersion.v1:
				return { key, secret };

			case ServerVersion.v2:
				return {
					key,
					secret,
					url: (Server.config.tls ? 'https://' : 'http://').concat(Server.config.domain + '/') + key,
					expirationTimestamp: Number(expirationTimestamp ?? 0)
				};
		}
	}

	public static async handleRemove(set: any, { key, secret }: HandleRemove) {
		if (!ValidatorUtils.isStringLengthBetweenLimits(key, 1, 255) || !ValidatorUtils.isAlphanumeric(key))
			return JSPError.send(set, 400, JSPError.message[ErrorCode.inputInvalid]);

		const file = Bun.file(Server.basePath + key);
		const fileExists = await file.exists();

		if (!fileExists) return JSPError.send(set, 404, JSPError.message[ErrorCode.documentNotFound]);

		const doc = await DocumentManager.read(file);

		if (doc.secret && doc.secret !== secret)
			return JSPError.send(set, 403, JSPError.message[ErrorCode.documentInvalidSecret]);

		return {
			// TODO: Use optimized Bun.unlink when available -> https://bun.sh/docs/api/file-io#writing-files-bun-write
			removed: await unlink(Server.basePath + key)
				.then(() => true)
				.catch(() => false)
		};
	}

	private static async handleGetDocument(set: any, { key, password }: HandleGetDocument) {
		if (!ValidatorUtils.isStringLengthBetweenLimits(key, 1, 255) || !ValidatorUtils.isAlphanumeric(key))
			return JSPError.send(set, 400, JSPError.message[ErrorCode.inputInvalid]);

		const file = Bun.file(Server.basePath + key);
		const fileExists = await file.exists();
		const doc = fileExists && (await DocumentManager.read(file));

		if (!doc || (doc.expirationTimestamp && doc.expirationTimestamp > 0 && doc.expirationTimestamp < Date.now())) {
			// TODO: Use optimized Bun.unlink when available -> https://bun.sh/docs/api/file-io#writing-files-bun-write
			if (fileExists) await unlink(Server.basePath + key).catch(() => null);

			return JSPError.send(set, 404, JSPError.message[ErrorCode.documentNotFound]);
		}

		if (doc.password && !password)
			return JSPError.send(set, 401, JSPError.message[ErrorCode.documentPasswordNeeded]);

		if (doc.password && doc.password !== password)
			return JSPError.send(set, 403, JSPError.message[ErrorCode.documentInvalidPassword]);

		return doc;
	}
}
