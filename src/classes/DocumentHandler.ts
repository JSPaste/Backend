import type { Parameters } from '../types/DocumentHandler.ts';
import { ServerVersion } from '../types/Server.ts';
import { ValidatorUtils } from '../utils/ValidatorUtils.ts';
import { Error } from './Error.ts';
import { ErrorCode, type ErrorSchema } from '../types/Error.ts';
import { Server } from './Server.ts';
import { DocumentManager } from './DocumentManager.ts';
import { unlink } from 'node:fs/promises';
import { StringUtils } from '../utils/StringUtils.ts';
import type { IDocumentDataStruct } from '../structures/Structures';
import type { BunFile } from 'bun';

export class DocumentHandler {
	private context: any;

	public set setContext(value: any) {
		this.context = value;
	}

	public async access(params: Parameters['access'], version: ServerVersion) {
		switch (version) {
			case ServerVersion.v1: {
				this.validateKey(params[version].key);

				const file = await this.validateKeyExistance(params[version].key);
				if (ValidatorUtils.isJSPError(file)) return file;

				const document = await DocumentManager.read(file);

				this.validateTimestamp(params[version].key, document.expirationTimestamp);

				const data = new TextDecoder().decode(document.rawFileData);

				return { key: params[version].key, data };
			}

			case ServerVersion.v2: {
				this.validateKey(params[version].key);

				const file = await this.validateKeyExistance(params[version].key);
				if (ValidatorUtils.isJSPError(file)) return file;

				const document = await DocumentManager.read(file);

				this.validateTimestamp(params[version].key, document.expirationTimestamp);
				this.validatePassword(params[version].password, document.password);

				const data = new TextDecoder().decode(document.rawFileData);

				return {
					key: params[version].key,
					data,
					url:
						(Server.config.tls ? 'https://' : 'http://').concat(Server.config.domain + '/') +
						params[version].key,
					expirationTimestamp: document.expirationTimestamp
				};
			}
		}
	}

	public async edit(params: Parameters['edit']) {
		this.validateKey(params.key);

		const file = await this.validateKeyExistance(params.key);
		if (ValidatorUtils.isJSPError(file)) return file;

		const document = await DocumentManager.read(file);

		this.validateSecret(params.secret, document.secret);

		const buffer = Buffer.from(params.body as ArrayBuffer);

		this.validateSizeBetweenLimits(buffer);

		document.rawFileData = buffer;

		return {
			edited: await DocumentManager.write(Server.config.documents.documentPath + params.key, document)
				.then(() => true)
				.catch(() => false)
		};
	}

	public async exists(params: Parameters['exists']) {
		this.validateKey(params.key);

		return Bun.file(Server.config.documents.documentPath + params.key).exists();
	}

	public async publish(params: Parameters['publish'], version: ServerVersion) {
		const bodyBuffer = Buffer.from(params[version].body as ArrayBuffer);

		switch (version) {
			case ServerVersion.v1: {
				const secret = StringUtils.createSecret();

				this.validateSizeBetweenLimits(bodyBuffer);

				const key = await StringUtils.createKey();

				const document: IDocumentDataStruct = {
					rawFileData: bodyBuffer,
					secret
				};

				await DocumentManager.write(Server.config.documents.documentPath + key, document);

				return { key, secret };
			}

			case ServerVersion.v2: {
				const secret = params[version].selectedSecret || StringUtils.createSecret();

				this.validateSecretLength(secret);
				this.validatePasswordLength(params[version].password);
				this.validateSelectedKey(params[version].selectedKey);
				this.validateSelectedKeyLength(params[version].selectedKeyLength);
				this.validateSizeBetweenLimits(bodyBuffer);

				let lifetime = params[version].lifetime ?? Server.config.documents.maxTime;

				// Make the document permanent if the value exceeds 5 years
				if (lifetime > 157_784_760) lifetime = 0;

				const msLifetime = lifetime * 1000;
				const expirationTimestamp = msLifetime > 0 ? BigInt(Date.now() + msLifetime) : undefined;

				const key =
					params[version].selectedKey ||
					(await StringUtils.createKey(params[version].selectedKeyLength ?? 8));

				if (params[version].selectedKey && (await StringUtils.keyExists(key)))
					throw Error.send(this.context, 400, Error.message[ErrorCode.documentKeyAlreadyExists]);

				const document: IDocumentDataStruct = {
					rawFileData: bodyBuffer,
					secret,
					expirationTimestamp,
					password: params[version].password
				};

				await DocumentManager.write(Server.config.documents.documentPath + key, document);

				return {
					key,
					secret,
					url: (Server.config.tls ? 'https://' : 'http://').concat(Server.config.domain + '/') + key,
					expirationTimestamp: Number(expirationTimestamp ?? 0)
				};
			}
		}
	}

	public async remove(params: Parameters['remove']) {
		this.validateKey(params.key);

		const file = await this.validateKeyExistance(params.key);
		if (ValidatorUtils.isJSPError(file)) return file;

		const document = await DocumentManager.read(file);

		this.validateSecret(params.secret, document.secret);

		return {
			removed: await unlink(Server.config.documents.documentPath + params.key)
				.then(() => true)
				.catch(() => false)
		};
	}

	private validateKey(key: string): ErrorSchema | undefined {
		if (!ValidatorUtils.isAlphanumeric(key) || !ValidatorUtils.isStringLengthBetweenLimits(key, 2, 32)) {
			return Error.send(this.context, 400, Error.message[ErrorCode.inputInvalid]);
		}

		return undefined;
	}

	private async validateKeyExistance(key: string): Promise<ErrorSchema | BunFile> {
		const file = Bun.file(Server.config.documents.documentPath + key);

		if (!(await file.exists())) {
			return Error.send(this.context, 404, Error.message[ErrorCode.documentNotFound]);
		}

		return file;
	}

	private validateSecret(secret: string | undefined, documentSecret: string): ErrorSchema | undefined {
		if (documentSecret && documentSecret !== secret) {
			throw Error.send(this.context, 403, Error.message[ErrorCode.documentInvalidSecret]);
		}

		return undefined;
	}

	private validateSecretLength(secret: string): ErrorSchema | undefined {
		if (!ValidatorUtils.isStringLengthBetweenLimits(secret || '', 1, 255)) {
			return Error.send(this.context, 400, Error.message[ErrorCode.documentInvalidSecretLength]);
		}

		return undefined;
	}

	private validatePassword(
		password: string | undefined,
		documentPassword: string | null | undefined
	): ErrorSchema | undefined {
		if (documentPassword && documentPassword !== password) {
			return Error.send(this.context, 403, Error.message[ErrorCode.documentInvalidPassword]);
		}

		return undefined;
	}

	private validatePasswordLength(password: string | undefined): ErrorSchema | undefined {
		if (password && !ValidatorUtils.isStringLengthBetweenLimits(password, 0, 255)) {
			return Error.send(this.context, 400, Error.message[ErrorCode.documentInvalidPasswordLength]);
		}

		return undefined;
	}

	private validateTimestamp(key: string, timestamp: number): ErrorSchema | undefined {
		if (timestamp && ValidatorUtils.isLengthBetweenLimits(timestamp, 0, Date.now())) {
			unlink(Server.config.documents.documentPath + key);

			return Error.send(this.context, 404, Error.message[ErrorCode.documentNotFound]);
		}

		return undefined;
	}

	private validateSizeBetweenLimits(body: Buffer): ErrorSchema | undefined {
		if (!ValidatorUtils.isLengthBetweenLimits(body, 1, Server.config.documents.maxLength)) {
			return Error.send(this.context, 400, Error.message[ErrorCode.documentInvalidLength]);
		}

		return undefined;
	}

	private validateSelectedKey(key: string | undefined): ErrorSchema | undefined {
		if (key && (!ValidatorUtils.isStringLengthBetweenLimits(key, 2, 32) || !ValidatorUtils.isAlphanumeric(key))) {
			return Error.send(this.context, 400, Error.message[ErrorCode.inputInvalid]);
		}

		return undefined;
	}

	private validateSelectedKeyLength(length: number | undefined): ErrorSchema | undefined {
		if (length && (length > 32 || length < 2)) {
			return Error.send(this.context, 400, Error.message[ErrorCode.documentInvalidKeyLength]);
		}

		return undefined;
	}
}
