import { unlink } from 'node:fs/promises';
import type { BunFile } from 'bun';
import type { IDocumentDataStruct } from '../structures/Structures';
import type { Parameters } from '../types/DocumentHandler.ts';
import { ErrorCode } from '../types/MessageHandler.ts';
import { ServerEndpointVersion } from '../types/Server.ts';
import { StringUtils } from '../utils/StringUtils.ts';
import { ValidatorUtils } from '../utils/ValidatorUtils.ts';
import { DocumentManager } from './DocumentManager.ts';
import { MessageHandler } from './MessageHandler.ts';
import { Server } from './Server.ts';

export class DocumentHandler {
	private version: ServerEndpointVersion | undefined;

	public setVersion(value: ServerEndpointVersion): this {
		this.version = value;
		return this;
	}

	public async access(params: Parameters['access']) {
		this.validateKey(params.key);

		const file = await this.retrieveDocument(params.key);
		const document = await DocumentManager.read(file);

		this.validateTimestamp(params.key, document.expirationTimestamp);
		this.validatePassword(params.password, document.password);

		const data = new TextDecoder().decode(document.rawFileData);

		switch (this.version) {
			case ServerEndpointVersion.v1: {
				return { key: params.key, data };
			}

			case ServerEndpointVersion.v2: {
				return {
					key: params.key,
					data,
					url: Server.hostname.concat('/', params.key),
					expirationTimestamp: document.expirationTimestamp
				};
			}

			default: {
				return MessageHandler.get(ErrorCode.serverError);
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
			edited: await DocumentManager.write(Server.config.documents.documentPath + params.key, document)
				.then(() => true)
				.catch(() => false)
		};
	}

	public async exists(params: Parameters['exists']) {
		this.validateKey(params.key);

		return Bun.file(Server.config.documents.documentPath + params.key).exists();
	}

	public async publish(params: Parameters['publish']) {
		this.validateSelectedKey(params.selectedKey);
		this.validateSelectedKeyLength(params.selectedKeyLength);
		this.validatePasswordLength(params.password);

		const secret = params.selectedSecret || StringUtils.createSecret();

		this.validateSecretLength(secret);

		const bodyBuffer = Buffer.from(params.body as ArrayBuffer);

		this.validateSizeBetweenLimits(bodyBuffer);

		let lifetime = params.lifetime ?? Server.config.documents.maxTime;

		// Make the document permanent if the value exceeds 5 years
		if (lifetime > 157_784_760) lifetime = 0;

		const msLifetime = lifetime * 1000;
		const expirationTimestamp = msLifetime > 0 ? BigInt(Date.now() + msLifetime) : undefined;

		const key = params.selectedKey || (await StringUtils.createKey(params.selectedKeyLength));

		if (params.selectedKey && (await StringUtils.keyExists(key))) {
			MessageHandler.send(ErrorCode.document_KeyAlreadyExists);
		}

		const document: IDocumentDataStruct = {
			rawFileData: bodyBuffer,
			secret,
			expirationTimestamp,
			password: params.password
		};

		await DocumentManager.write(Server.config.documents.documentPath + key, document);

		switch (this.version) {
			case ServerEndpointVersion.v1: {
				return { key, secret };
			}

			case ServerEndpointVersion.v2: {
				return {
					key,
					secret,
					url: Server.hostname.concat('/', key),
					expirationTimestamp: Number(expirationTimestamp ?? 0)
				};
			}

			default: {
				return MessageHandler.get(ErrorCode.serverError);
			}
		}
	}

	public async remove(params: Parameters['remove']) {
		this.validateKey(params.key);

		const file = await this.retrieveDocument(params.key);
		const document = await DocumentManager.read(file);

		this.validateSecret(params.secret, document.secret);

		return {
			removed: await unlink(Server.config.documents.documentPath + params.key)
				.then(() => true)
				.catch(() => false)
		};
	}

	private async retrieveDocument(key: string): Promise<BunFile> {
		const file = Bun.file(Server.config.documents.documentPath + key);

		if (!(await file.exists())) {
			MessageHandler.send(ErrorCode.document_NotFound);
		}

		return file;
	}

	private validateKey(key: string): void {
		if (
			!ValidatorUtils.isBase64URL(key) ||
			!ValidatorUtils.isLengthWithinRange(
				Bun.stringWidth(key),
				Server.config.documents.minKeyLength,
				Server.config.documents.maxKeyLength
			)
		) {
			MessageHandler.send(ErrorCode.validation_invalid);
		}
	}

	private validateSecret(secret: string, documentSecret: string): void {
		if (documentSecret && documentSecret !== secret) {
			MessageHandler.send(ErrorCode.document_InvalidSecret);
		}
	}

	private validateSecretLength(secret: string): void {
		if (
			ValidatorUtils.isEmptyString(secret) ||
			!ValidatorUtils.isLengthWithinRange(Bun.stringWidth(secret), 1, 255)
		) {
			MessageHandler.send(ErrorCode.document_InvalidSecretLength);
		}
	}

	private validatePassword(password: string | undefined, documentPassword: string | null | undefined): void {
		if (password) {
			if (documentPassword && password !== documentPassword) {
				MessageHandler.send(ErrorCode.document_InvalidPassword);
			}
		}
	}

	private validatePasswordLength(password: string | undefined): void {
		if (
			password &&
			(ValidatorUtils.isEmptyString(password) ||
				!ValidatorUtils.isLengthWithinRange(Bun.stringWidth(password), 1, 255))
		) {
			MessageHandler.send(ErrorCode.document_InvalidPasswordLength);
		}
	}

	private validateTimestamp(key: string, timestamp: number): void {
		if (timestamp && ValidatorUtils.isLengthWithinRange(timestamp, 0, Date.now())) {
			unlink(Server.config.documents.documentPath + key);

			MessageHandler.send(ErrorCode.document_NotFound);
		}
	}

	private validateSizeBetweenLimits(body: Buffer): void {
		if (!ValidatorUtils.isLengthWithinRange(body.length, 1, Server.config.documents.maxLength)) {
			MessageHandler.send(ErrorCode.document_InvalidLength);
		}
	}

	private validateSelectedKey(key: string | undefined): void {
		if (
			key &&
			(!ValidatorUtils.isBase64URL(key) ||
				!ValidatorUtils.isLengthWithinRange(
					Bun.stringWidth(key),
					Server.config.documents.minKeyLength,
					Server.config.documents.maxKeyLength
				))
		) {
			MessageHandler.send(ErrorCode.validation_invalid);
		}
	}

	private validateSelectedKeyLength(length: number | undefined): void {
		if (
			length &&
			ValidatorUtils.isLengthWithinRange(
				length,
				Server.config.documents.minKeyLength,
				Server.config.documents.maxKeyLength
			)
		) {
			MessageHandler.send(ErrorCode.document_InvalidKeyLength);
		}
	}
}
