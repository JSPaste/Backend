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
	private readonly server: Server;
	private context: any;

	public constructor(server: Server) {
		this.server = server;
	}

	public set setContext(value: any) {
		this.context = value;
	}

	public async access(params: Access, version: ServerVersion) {
		this.validateKeyValue(params.key);

		const file = await this.validateKeyExistance(params.key);
		const document = await DocumentManager.read(file);

		if (
			document.expirationTimestamp &&
			ValidatorUtils.isLengthBetweenLimits(document.expirationTimestamp, 0, Date.now())
		) {
			await unlink(Server.config.documents.documentPath + params.key);

			throw JSPError.send(this.context, 404, JSPError.message[ErrorCode.documentNotFound]);
		}

		if (document.password && document.password !== params.password) {
			throw JSPError.send(this.context, 403, JSPError.message[ErrorCode.documentInvalidPassword]);
		}

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
		this.validateKeyValue(params.key);

		const buffer = Buffer.from(params.newBody as ArrayBuffer);

		if (!ValidatorUtils.isLengthBetweenLimits(buffer, 1, Server.config.documents.maxLength))
			throw JSPError.send(this.context, 400, JSPError.message[ErrorCode.documentInvalidLength]);

		const file = await this.validateKeyExistance(params.key);
		const document = await DocumentManager.read(file);

		if (document.secret && document.secret !== params.secret) {
			throw JSPError.send(this.context, 403, JSPError.message[ErrorCode.documentInvalidSecret]);
		}

		document.rawFileData = buffer;

		return {
			edited: await DocumentManager.write(Server.config.documents.documentPath + params.key, document)
				.then(() => true)
				.catch(() => false)
		};
	}

	public async exists(params: Exists): Promise<boolean> {
		this.validateKeyValue(params.key);

		return Bun.file(Server.config.documents.documentPath + params.key).exists();
	}

	// TODO: Rework publish
	public async publish(params: Publish, version: ServerVersion) {
		const buffer = Buffer.from(params.body as ArrayBuffer);

		if (!ValidatorUtils.isLengthBetweenLimits(buffer, 1, Server.config.documents.maxLength))
			throw JSPError.send(this.context, 400, JSPError.message[ErrorCode.documentInvalidLength]);

		const secret = params.selectedSecret || StringUtils.createSecret();

		if (!ValidatorUtils.isStringLengthBetweenLimits(secret || '', 1, 255))
			throw JSPError.send(this.context, 400, JSPError.message[ErrorCode.documentInvalidSecretLength]);

		if (
			params.selectedKey &&
			(!ValidatorUtils.isStringLengthBetweenLimits(params.selectedKey, 2, 32) ||
				!ValidatorUtils.isAlphanumeric(params.selectedKey))
		)
			throw JSPError.send(this.context, 400, JSPError.message[ErrorCode.inputInvalid]);

		if (params.selectedKeyLength && (params.selectedKeyLength > 32 || params.selectedKeyLength < 2))
			throw JSPError.send(this.context, 400, JSPError.message[ErrorCode.documentInvalidKeyLength]);

		if (params.password && !ValidatorUtils.isStringLengthBetweenLimits(params.password, 0, 255))
			throw JSPError.send(this.context, 400, JSPError.message[ErrorCode.documentInvalidPasswordLength]);

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
		this.validateKeyValue(params.key);

		const file = await this.validateKeyExistance(params.key);
		const document = await DocumentManager.read(file);

		if (document.secret && document.secret !== params.secret) {
			throw JSPError.send(this.context, 403, JSPError.message[ErrorCode.documentInvalidSecret]);
		}

		return {
			removed: await unlink(Server.config.documents.documentPath + params.key)
				.then(() => true)
				.catch(() => false)
		};
	}

	private validateKeyValue(key: string): void {
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
}
