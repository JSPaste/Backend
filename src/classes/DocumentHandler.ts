import type { Parameters } from '../types/DocumentHandler.ts';
import { ServerEndpointVersion } from '../types/Server.ts';
import { ValidatorUtils } from '../utils/ValidatorUtils.ts';
import { JSPError } from './JSPError.ts';
import { JSPErrorCode } from '../types/JSPError.ts';
import { Server } from './Server.ts';
import { DocumentManager } from './DocumentManager.ts';
import { unlink } from 'node:fs/promises';
import { StringUtils } from '../utils/StringUtils.ts';
import type { IDocumentDataStruct } from '../structures/Structures';
import type { BunFile } from 'bun';

export class DocumentHandler {
	private context: any;
	private version: ServerEndpointVersion | undefined;

	public setContext(value: any): this {
		this.context = value;
		return this;
	}

	public setVersion(value: ServerEndpointVersion): this {
		this.version = value;
		return this;
	}

	public async access(params: Parameters['access']) {
		this.validateKey(params.key);

		const file = await this.validateKeyExistance(params.key);
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
				return JSPError.send(this.context, 500, JSPError.message[JSPErrorCode.internalServerError]);
			}
		}
	}

	public async edit(params: Parameters['edit']) {
		this.validateKey(params.key);

		const file = await this.validateKeyExistance(params.key);
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

		const key = params.selectedKey || (await StringUtils.createKey(params.selectedKeyLength ?? 8));

		if (params.selectedKey && (await StringUtils.keyExists(key)))
			throw JSPError.send(this.context, 400, JSPError.message[JSPErrorCode.documentKeyAlreadyExists]);

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
				return JSPError.send(this.context, 500, JSPError.message[JSPErrorCode.internalServerError]);
			}
		}
	}

	public async remove(params: Parameters['remove']) {
		this.validateKey(params.key);

		const file = await this.validateKeyExistance(params.key);
		const document = await DocumentManager.read(file);

		this.validateSecret(params.secret, document.secret);

		return {
			removed: await unlink(Server.config.documents.documentPath + params.key)
				.then(() => true)
				.catch(() => false)
		};
	}

	private validateKey(key: string): void {
		if (!ValidatorUtils.isBase64URL(key) || !ValidatorUtils.isStringLengthWithinRange(key, 2, 32)) {
			throw JSPError.send(this.context, 400, JSPError.message[JSPErrorCode.inputInvalid]);
		}
	}

	private async validateKeyExistance(key: string): Promise<BunFile> {
		const file = Bun.file(Server.config.documents.documentPath + key);

		if (!(await file.exists())) {
			throw JSPError.send(this.context, 404, JSPError.message[JSPErrorCode.documentNotFound]);
		}

		return file;
	}

	private validateSecret(secret: string | undefined, documentSecret: string): void {
		if (documentSecret && documentSecret !== secret) {
			throw JSPError.send(this.context, 403, JSPError.message[JSPErrorCode.documentInvalidSecret]);
		}
	}

	private validateSecretLength(secret: string): void {
		if (!ValidatorUtils.isStringLengthWithinRange(secret || '', 1, 255)) {
			throw JSPError.send(this.context, 400, JSPError.message[JSPErrorCode.documentInvalidSecretLength]);
		}
	}

	private validatePassword(password: undefined | string, documentPassword: undefined | null | string): void {
		if (password && documentPassword && documentPassword !== password) {
			throw JSPError.send(this.context, 403, JSPError.message[JSPErrorCode.documentInvalidPassword]);
		}
	}

	private validatePasswordLength(password: string | undefined): void {
		if (password && !ValidatorUtils.isStringLengthWithinRange(password, 0, 255)) {
			throw JSPError.send(this.context, 400, JSPError.message[JSPErrorCode.documentInvalidPasswordLength]);
		}
	}

	private validateTimestamp(key: string, timestamp: number): void {
		if (timestamp && ValidatorUtils.isLengthWithinRange(timestamp, 0, Date.now())) {
			unlink(Server.config.documents.documentPath + key);

			throw JSPError.send(this.context, 404, JSPError.message[JSPErrorCode.documentNotFound]);
		}
	}

	private validateSizeBetweenLimits(body: Buffer): void {
		if (!ValidatorUtils.isLengthWithinRange(body.length, 1, Server.config.documents.maxLength)) {
			throw JSPError.send(this.context, 400, JSPError.message[JSPErrorCode.documentInvalidLength]);
		}
	}

	private validateSelectedKey(key: string | undefined): void {
		if (key && (!ValidatorUtils.isStringLengthWithinRange(key, 2, 32) || !ValidatorUtils.isBase64URL(key))) {
			throw JSPError.send(this.context, 400, JSPError.message[JSPErrorCode.inputInvalid]);
		}
	}

	private validateSelectedKeyLength(length: number | undefined): void {
		if (length && ValidatorUtils.isLengthWithinRange(length, 2, 32)) {
			throw JSPError.send(this.context, 400, JSPError.message[JSPErrorCode.documentInvalidKeyLength]);
		}
	}
}
