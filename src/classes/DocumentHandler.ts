import { unlink } from 'node:fs/promises';
import type { BunFile } from 'bun';
import type { IDocumentDataStruct } from '../structures/Structures';
import type { Parameters } from '../types/DocumentHandler.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';
import { ServerEndpointVersion } from '../types/Server.ts';
import { StringUtils } from '../utils/StringUtils.ts';
import { ValidatorUtils } from '../utils/ValidatorUtils.ts';
import { DocumentManager } from './DocumentManager.ts';
import { ErrorHandler } from './ErrorHandler.ts';
import { Server } from './Server.ts';

export class DocumentHandler {
	private readonly SERVER: Server;
	private VERSION: ServerEndpointVersion | undefined;

	public constructor(server: Server) {
		this.SERVER = server;
	}

	public setVersion(version: ServerEndpointVersion): this {
		this.VERSION = version;
		return this;
	}

	public async access(params: Parameters['access']) {
		this.validateKey(params.key);

		const file = await this.retrieveDocument(params.key);
		const document = await DocumentManager.read(file);

		this.validateTimestamp(params.key, document.expirationTimestamp);
		this.validatePassword(params.password, document.password);

		const data = new TextDecoder().decode(document.rawFileData);

		switch (this.VERSION) {
			case ServerEndpointVersion.V1: {
				return { key: params.key, data };
			}

			case ServerEndpointVersion.V2: {
				return {
					key: params.key,
					data,
					url: Server.HOSTNAME.concat('/', params.key),
					expirationTimestamp: document.expirationTimestamp
				};
			}

			default: {
				return ErrorHandler.get(ErrorCode.crash);
			}
		}
	}

	public async edit(params: Parameters['edit']) {
		this.validateKey(params.key);

		const file = await this.retrieveDocument(params.key);
		const document = await DocumentManager.read(file);

		this.validateSecret(params.secret, document.secret);

		const buffer = Buffer.from(params.body as ArrayBuffer);

		this.validateSizeBetweenLimits(buffer);

		document.rawFileData = buffer;

		return {
			edited: await DocumentManager.write(Server.DOCUMENT_PATH + params.key, document)
				.then(() => true)
				.catch(() => false)
		};
	}

	public async exists(params: Parameters['exists']) {
		this.validateKey(params.key);

		return Bun.file(Server.DOCUMENT_PATH + params.key).exists();
	}

	public async publish(params: Parameters['publish']) {
		this.validateSelectedKey(params.selectedKey);
		this.validateSelectedKeyLength(params.selectedKeyLength);
		this.validatePasswordLength(params.password);

		const secret = params.selectedSecret || StringUtils.createSecret();

		this.validateSecretLength(secret);

		const bodyBuffer = Buffer.from(params.body as ArrayBuffer);

		this.validateSizeBetweenLimits(bodyBuffer);

		let lifetime = params.lifetime ?? Server.DOCUMENT_MAX_TIME;

		// Make the document permanent if the value exceeds 5 years
		if (lifetime > 157_784_760) lifetime = 0;

		const msLifetime = lifetime * 1000;
		const expirationTimestamp = msLifetime > 0 ? BigInt(Date.now() + msLifetime) : undefined;

		const key = params.selectedKey || (await StringUtils.createKey(params.selectedKeyLength));

		if (params.selectedKey && (await StringUtils.keyExists(key))) {
			this.SERVER.errorHandler.send(ErrorCode.documentKeyAlreadyExists);
		}

		const document: IDocumentDataStruct = {
			rawFileData: bodyBuffer,
			secret,
			expirationTimestamp,
			password: params.password
		};

		await DocumentManager.write(Server.DOCUMENT_PATH + key, document);

		switch (this.VERSION) {
			case ServerEndpointVersion.V1: {
				return { key, secret };
			}

			case ServerEndpointVersion.V2: {
				return {
					key,
					secret,
					url: Server.HOSTNAME.concat('/', key),
					expirationTimestamp: Number(expirationTimestamp ?? 0)
				};
			}

			default: {
				return ErrorHandler.get(ErrorCode.crash);
			}
		}
	}

	public async remove(params: Parameters['remove']) {
		this.validateKey(params.key);

		const file = await this.retrieveDocument(params.key);
		const document = await DocumentManager.read(file);

		this.validateSecret(params.secret, document.secret);

		return {
			removed: await unlink(Server.DOCUMENT_PATH + params.key)
				.then(() => true)
				.catch(() => false)
		};
	}

	private async retrieveDocument(key: string): Promise<BunFile> {
		const file = Bun.file(Server.DOCUMENT_PATH + key);

		if (!(await file.exists())) {
			this.SERVER.errorHandler.send(ErrorCode.documentNotFound);
		}

		return file;
	}

	private validateKey(key: string): void {
		if (
			!ValidatorUtils.isValidBase64URL(key) ||
			!ValidatorUtils.isLengthWithinRange(
				Bun.stringWidth(key),
				Server.DOCUMENT_KEY_LENGTH_MIN,
				Server.DOCUMENT_KEY_LENGTH_MAX
			)
		) {
			this.SERVER.errorHandler.send(ErrorCode.validationInvalid);
		}
	}

	private validateSecret(secret: string, documentSecret: string): void {
		if (documentSecret && documentSecret !== secret) {
			this.SERVER.errorHandler.send(ErrorCode.documentInvalidSecret);
		}
	}

	private validateSecretLength(secret: string): void {
		if (
			ValidatorUtils.isEmptyString(secret) ||
			!ValidatorUtils.isLengthWithinRange(Bun.stringWidth(secret), 1, 255)
		) {
			this.SERVER.errorHandler.send(ErrorCode.documentInvalidSecretLength);
		}
	}

	private validatePassword(password: string | undefined, documentPassword: string | null | undefined): void {
		if (password) {
			if (documentPassword && password !== documentPassword) {
				this.SERVER.errorHandler.send(ErrorCode.documentInvalidPassword);
			}
		}
	}

	private validatePasswordLength(password: string | undefined): void {
		if (
			password &&
			(ValidatorUtils.isEmptyString(password) ||
				!ValidatorUtils.isLengthWithinRange(Bun.stringWidth(password), 1, 255))
		) {
			this.SERVER.errorHandler.send(ErrorCode.documentInvalidPasswordLength);
		}
	}

	private validateTimestamp(key: string, timestamp: number): void {
		if (timestamp && ValidatorUtils.isLengthWithinRange(timestamp, 0, Date.now())) {
			unlink(Server.DOCUMENT_PATH + key);

			this.SERVER.errorHandler.send(ErrorCode.documentNotFound);
		}
	}

	private validateSizeBetweenLimits(body: Buffer): void {
		if (!ValidatorUtils.isLengthWithinRange(body.length, 1, Server.DOCUMENT_MAX_LENGTH)) {
			this.SERVER.errorHandler.send(ErrorCode.documentInvalidLength);
		}
	}

	private validateSelectedKey(key: string | undefined): void {
		if (
			key &&
			(!ValidatorUtils.isValidBase64URL(key) ||
				!ValidatorUtils.isLengthWithinRange(
					Bun.stringWidth(key),
					Server.DOCUMENT_KEY_LENGTH_MIN,
					Server.DOCUMENT_KEY_LENGTH_MAX
				))
		) {
			this.SERVER.errorHandler.send(ErrorCode.validationInvalid);
		}
	}

	private validateSelectedKeyLength(length: number | undefined): void {
		if (
			length &&
			ValidatorUtils.isLengthWithinRange(length, Server.DOCUMENT_KEY_LENGTH_MIN, Server.DOCUMENT_KEY_LENGTH_MAX)
		) {
			this.SERVER.errorHandler.send(ErrorCode.documentInvalidKeyLength);
		}
	}
}
