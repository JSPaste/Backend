import { unlink } from 'node:fs/promises';
import { DataValidator } from './DataValidator';
import { DocumentManager } from './DocumentManager';
import { createKey } from '../utils/createKey.ts';
import type { DocumentDataStruct } from '../structures/documentStruct.ts';
import {
	APIVersions,
	basePath,
	defaultDocumentLifetime,
	JSPErrorMessage,
	maxDocLength,
	viewDocumentPath
} from '../utils/constants.ts';
import { ErrorSender } from './ErrorSender.ts';
import { createSecret } from '../utils/createSecret.ts';

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
	public static async handleAccess({ errorSender, key, password, raw = false }: HandleAccess, version: APIVersions) {
		const res = await DocumentHandler.handleGetDocument({ errorSender, key: key, password });

		if (ErrorSender.isJSPError(res)) return res;

		const data = new TextDecoder().decode(res.rawFileData);

		if (raw) return data;

		switch (version) {
			case APIVersions.v1:
				return { key, data };

			case APIVersions.v2:
				return {
					key,
					data,
					url: viewDocumentPath + key,
					expirationTimestamp: res.expirationTimestamp ? Number(res.expirationTimestamp) : undefined
				};
		}
	}

	public static async handleEdit({ errorSender, key, newBody, secret }: HandleEdit) {
		if (!DataValidator.isStringLengthBetweenLimits(key, 1, 255) || !DataValidator.isAlphanumeric(key))
			return errorSender.sendError(400, JSPErrorMessage['jsp.input.invalid']);

		const file = Bun.file(basePath + key);
		const fileExists = await file.exists();

		if (!fileExists) return errorSender.sendError(404, JSPErrorMessage['jsp.document.not_found']);

		const buffer = Buffer.from(newBody as ArrayBuffer);

		if (!DataValidator.isLengthBetweenLimits(buffer, 1, maxDocLength))
			return errorSender.sendError(400, JSPErrorMessage['jsp.document.invalid_length']);

		const doc = await DocumentManager.read(file);

		if (doc.secret && doc.secret !== secret)
			return errorSender.sendError(403, JSPErrorMessage['jsp.document.invalid_secret']);

		doc.rawFileData = buffer;

		return {
			edited: await DocumentManager.write(basePath + key, doc)
				.then(() => true)
				.catch(() => false)
		};
	}

	public static async handleExists({ errorSender, key }: HandleExists) {
		if (!DataValidator.isStringLengthBetweenLimits(key, 1, 255) || !DataValidator.isAlphanumeric(key))
			return errorSender.sendError(400, JSPErrorMessage['jsp.input.invalid']);

		return await Bun.file(basePath + key).exists();
	}

	public static async handlePublish(
		{ errorSender, body, selectedSecret, lifetime, password }: HandlePublish,
		version: APIVersions
	) {
		const buffer = Buffer.from(body as ArrayBuffer);

		if (!DataValidator.isLengthBetweenLimits(buffer, 1, maxDocLength))
			return errorSender.sendError(400, JSPErrorMessage['jsp.document.invalid_length']);

		const secret = selectedSecret || createSecret();

		if (!DataValidator.isStringLengthBetweenLimits(secret || '', 1, 255))
			return errorSender.sendError(400, JSPErrorMessage['jsp.document.invalid_secret_length']);

		if (password && !DataValidator.isStringLengthBetweenLimits(password, 0, 255))
			return errorSender.sendError(400, JSPErrorMessage['jsp.document.invalid_password_length']);

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
					expirationTimestamp: Number(expirationTimestamp ?? 0)
				};
		}
	}

	public static async handleRemove({ errorSender, key, secret }: HandleRemove) {
		if (!DataValidator.isStringLengthBetweenLimits(key, 1, 255) || !DataValidator.isAlphanumeric(key))
			return errorSender.sendError(400, JSPErrorMessage['jsp.input.invalid']);

		const file = Bun.file(basePath + key);
		const fileExists = await file.exists();

		if (!fileExists) return errorSender.sendError(404, JSPErrorMessage['jsp.document.not_found']);

		const doc = await DocumentManager.read(file);

		if (doc.secret && doc.secret !== secret)
			return errorSender.sendError(403, JSPErrorMessage['jsp.document.invalid_secret']);

		// FIXME: Use bun
		return {
			removed: await unlink(basePath + key)
				.then(() => true)
				.catch(() => false)
		};
	}

	private static async handleGetDocument({ errorSender, key, password }: HandleGetDocument) {
		if (!DataValidator.isStringLengthBetweenLimits(key, 1, 255) || !DataValidator.isAlphanumeric(key))
			return errorSender.sendError(400, JSPErrorMessage['jsp.input.invalid']);

		const file = Bun.file(basePath + key);
		const fileExists = await file.exists();
		const doc = fileExists && (await DocumentManager.read(file));

		if (!doc || (doc.expirationTimestamp && doc.expirationTimestamp > 0 && doc.expirationTimestamp <= Date.now())) {
			if (fileExists) await unlink(basePath + key).catch(() => null);

			return errorSender.sendError(404, JSPErrorMessage['jsp.document.not_found']);
		}

		if (doc.password && !password)
			return errorSender.sendError(401, JSPErrorMessage['jsp.document.needs_password']);

		if (doc.password && doc.password !== password)
			return errorSender.sendError(403, JSPErrorMessage['jsp.document.invalid_password']);

		return doc;
	}
}
