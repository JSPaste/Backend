import type { Access, Edit, Exists, Publish, Remove } from '../types/DocumentHandler.ts';
import { ServerVersion } from '../types/Server.ts';
import { ValidatorUtils } from '../utils/ValidatorUtils.ts';
import { JSPError } from './JSPError.ts';
import { ErrorCode } from '../types/JSPError.ts';
import { Server } from './Server.ts';
import { DocumentManager } from './DocumentManager.ts';
import { unlink } from 'node:fs/promises';
import { StringUtils } from '../utils/StringUtils.ts';
import type { IDocumentDataStruct } from '../structures/Structures';
import type { Range } from '../types/Range.ts';
import type { BunFile } from 'bun';

export class DocumentHandler {
	private context: any;

	public set setContext(value: any) {
		this.context = value;
	}

	public async access(params: Access, version: ServerVersion) {
		this.validateKey(params.key);

		const file = await this.validateKeyExistance(params.key);
		const document = await DocumentManager.read(file);

		this.validateTimestamp(params.key, document.expirationTimestamp);
		this.validatePassword(params.password, document.password);

		const data = new TextDecoder().decode(document.rawFileData);

		switch (version) {
			case ServerVersion.v1:
				return { key: params.key, data };

			case ServerVersion.v2:
				return {
					key: params.key,
					data,
					url: (Server.config.tls ? 'https://' : 'http://').concat(Server.config.domain + '/') + params.key,
					expirationTimestamp: document.expirationTimestamp
				};
		}
	}

	public async edit(params: Edit) {
		this.validateKey(params.key);

		const file = await this.validateKeyExistance(params.key);
		const document = await DocumentManager.read(file);

		this.validateSecret(params.secret, document.secret);

		const buffer = Buffer.from(params.newBody as ArrayBuffer);

		this.validateSizeBetweenLimits(buffer);

		document.rawFileData = buffer;

		return {
			edited: await DocumentManager.write(Server.config.documents.documentPath + params.key, document)
				.then(() => true)
				.catch(() => false)
		};
	}

	public async exists(params: Exists) {
		this.validateKey(params.key);

		return Bun.file(Server.config.documents.documentPath + params.key).exists();
	}

	public async publish(params: Publish, version: ServerVersion) {
		const secret = params.selectedSecret || StringUtils.createSecret();

		this.validateSecretLength(secret);
		this.validatePasswordLength(params.password);
		this.validateSelectedKey(params.selectedKey);
		this.validateSelectedKeyLength(params.selectedKeyLength);

		const buffer = Buffer.from(params.body as ArrayBuffer);

		this.validateSizeBetweenLimits(buffer);

		params.lifetime = params.lifetime ?? Server.config.documents.maxTime;

		// Make the document permanent if the value exceeds 5 years
		if (params.lifetime > 157_784_760) params.lifetime = 0;

		const msLifetime = params.lifetime * 1000;
		const expirationTimestamp = msLifetime > 0 ? BigInt(Date.now() + msLifetime) : undefined;

		const newDoc: IDocumentDataStruct = {
			rawFileData: buffer,
			secret,
			expirationTimestamp,
			password: params.password
		};

		const key =
			params.selectedKey || (await StringUtils.createKey((params.selectedKeyLength as Range<2, 32>) || 8));

		if (params.selectedKey && (await StringUtils.keyExists(key)))
			throw JSPError.send(this.context, 400, JSPError.message[ErrorCode.documentKeyAlreadyExists]);

		await DocumentManager.write(Server.config.documents.documentPath + key, newDoc);

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

	public async remove(params: Remove) {
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
		if (!ValidatorUtils.isAlphanumeric(key) || !ValidatorUtils.isStringLengthBetweenLimits(key, 2, 32)) {
			throw JSPError.send(this.context, 400, JSPError.message[ErrorCode.inputInvalid]);
		}
	}

	private async validateKeyExistance(key: string): Promise<BunFile> {
		const file = Bun.file(Server.config.documents.documentPath + key);

		if (!(await file.exists())) {
			throw JSPError.send(this.context, 404, JSPError.message[ErrorCode.documentNotFound]);
		}

		return file;
	}

	private validateSecret(secret: string | undefined, documentSecret: string): void {
		if (documentSecret && documentSecret !== secret) {
			throw JSPError.send(this.context, 403, JSPError.message[ErrorCode.documentInvalidSecret]);
		}
	}

	private validateSecretLength(secret: string): void {
		if (!ValidatorUtils.isStringLengthBetweenLimits(secret || '', 1, 255)) {
			throw JSPError.send(this.context, 400, JSPError.message[ErrorCode.documentInvalidSecretLength]);
		}
	}

	private validatePassword(password: string | undefined, documentPassword: string | null | undefined): void {
		if (documentPassword && documentPassword !== password) {
			throw JSPError.send(this.context, 403, JSPError.message[ErrorCode.documentInvalidPassword]);
		}
	}

	private validatePasswordLength(password: string | undefined): void {
		if (password && !ValidatorUtils.isStringLengthBetweenLimits(password, 0, 255)) {
			throw JSPError.send(this.context, 400, JSPError.message[ErrorCode.documentInvalidPasswordLength]);
		}
	}

	private validateTimestamp(key: string, timestamp: number): void {
		if (timestamp && ValidatorUtils.isLengthBetweenLimits(timestamp, 0, Date.now())) {
			unlink(Server.config.documents.documentPath + key);

			throw JSPError.send(this.context, 404, JSPError.message[ErrorCode.documentNotFound]);
		}
	}

	private validateSizeBetweenLimits(body: Buffer): void {
		if (!ValidatorUtils.isLengthBetweenLimits(body, 1, Server.config.documents.maxLength)) {
			throw JSPError.send(this.context, 400, JSPError.message[ErrorCode.documentInvalidLength]);
		}
	}

	private validateSelectedKey(key: string | undefined): void {
		if (key && (!ValidatorUtils.isStringLengthBetweenLimits(key, 2, 32) || !ValidatorUtils.isAlphanumeric(key))) {
			throw JSPError.send(this.context, 400, JSPError.message[ErrorCode.inputInvalid]);
		}
	}

	private validateSelectedKeyLength(length: number | undefined): void {
		if (length && (length > 32 || length < 2)) {
			throw JSPError.send(this.context, 400, JSPError.message[ErrorCode.documentInvalidKeyLength]);
		}
	}
}
