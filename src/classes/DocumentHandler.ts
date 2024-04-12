import { unlink } from 'node:fs/promises';
import type { BunFile } from 'bun';
import { decode, encode } from 'cbor-x';
import type { CompatDocumentStruct, Parameters } from '../types/DocumentHandler.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';
import { ServerEndpointVersion } from '../types/Server.ts';
import { StringUtils } from '../utils/StringUtils.ts';
import { ValidatorUtils } from '../utils/ValidatorUtils.ts';
import { ErrorHandler } from './ErrorHandler.ts';
import { Server } from './Server.ts';

export class DocumentHandler {
	public static async compatDocumentRead(file: BunFile): Promise<CompatDocumentStruct> {
		return decode(Bun.inflateSync(await file.arrayBuffer()));
	}

	public static async compatDocumentWrite(filePath: string, document: CompatDocumentStruct): Promise<void> {
		await Bun.write(filePath, Bun.deflateSync(encode(document)));
	}

	public static async accessRaw(params: Parameters['access']) {
		DocumentHandler.validateKey(params.key);

		const file = await DocumentHandler.retrieveDocument(params.key);
		const document = await DocumentHandler.compatDocumentRead(file);

		DocumentHandler.validateTimestamp(params.key, document.expirationTimestamp);
		await DocumentHandler.validatePassword(params.password, document.password);

		return new Response(document.rawFileData);
	}

	public static async access(params: Parameters['access'], version: ServerEndpointVersion) {
		DocumentHandler.validateKey(params.key);

		const file = await DocumentHandler.retrieveDocument(params.key);
		const document = await DocumentHandler.compatDocumentRead(file);

		DocumentHandler.validateTimestamp(params.key, document.expirationTimestamp);
		await DocumentHandler.validatePassword(params.password, document.password);

		const data = new TextDecoder().decode(document.rawFileData);

		switch (version) {
			case ServerEndpointVersion.V1: {
				return { key: params.key, data };
			}

			case ServerEndpointVersion.V2: {
				return {
					key: params.key,
					data,
					url: Server.HOSTNAME.concat('/', params.key),
					expirationTimestamp: document.expirationTimestamp ?? -1
				};
			}
		}
	}

	public static async edit(params: Parameters['edit']) {
		DocumentHandler.validateKey(params.key);

		const file = await DocumentHandler.retrieveDocument(params.key);
		const document = await DocumentHandler.compatDocumentRead(file);

		DocumentHandler.validateSecret(params.secret, document.secret);

		const buffer = Buffer.from(params.body as ArrayBuffer);

		DocumentHandler.validateSizeBetweenLimits(buffer);

		document.rawFileData = buffer;

		return {
			edited: await DocumentHandler.compatDocumentWrite(Server.DOCUMENT_PATH + params.key, document)
				.then(() => true)
				.catch(() => false)
		};
	}

	public static async exists(params: Parameters['exists']) {
		DocumentHandler.validateKey(params.key);

		return Bun.file(Server.DOCUMENT_PATH + params.key).exists();
	}

	public static async publish(params: Parameters['publish'], version: ServerEndpointVersion) {
		DocumentHandler.validateSelectedKey(params.selectedKey);
		DocumentHandler.validateSelectedKeyLength(params.selectedKeyLength);
		DocumentHandler.validatePasswordLength(params.password);

		const secret = params.selectedSecret || StringUtils.createSecret();

		DocumentHandler.validateSecretLength(secret);

		const bodyArray = new Uint8Array(params.body);

		DocumentHandler.validateSizeBetweenLimits(bodyArray);

		let lifetime = params.lifetime ?? Server.DOCUMENT_MAXTIME;

		// Make the document permanent if the value exceeds 5 years
		if (lifetime > 157_784_760) lifetime = 0;

		const msLifetime = lifetime * 1000;
		const expirationTimestamp = msLifetime > 0 ? Date.now() + msLifetime : 0;

		const key = params.selectedKey || (await StringUtils.createKey(params.selectedKeyLength));

		if (params.selectedKey && (await StringUtils.keyExists(key))) {
			ErrorHandler.send(ErrorCode.documentKeyAlreadyExists);
		}

		const document: CompatDocumentStruct = {
			rawFileData: bodyArray,
			secret,
			expirationTimestamp,
			password: params.password ? await Bun.password.hash(params.password) : null
		};

		await DocumentHandler.compatDocumentWrite(Server.DOCUMENT_PATH + key, document);

		switch (version) {
			case ServerEndpointVersion.V1: {
				return { key, secret };
			}

			case ServerEndpointVersion.V2: {
				return {
					key,
					secret,
					url: Server.HOSTNAME.concat('/', key) + (params.password ? `/?p=${params.password}` : ''),
					expirationTimestamp: expirationTimestamp
				};
			}
		}
	}

	public static async remove(params: Parameters['remove']) {
		DocumentHandler.validateKey(params.key);

		const file = await DocumentHandler.retrieveDocument(params.key);
		const document = await DocumentHandler.compatDocumentRead(file);

		DocumentHandler.validateSecret(params.secret, document.secret);

		return {
			removed: await unlink(Server.DOCUMENT_PATH + params.key)
				.then(() => true)
				.catch(() => false)
		};
	}

	private static async retrieveDocument(key: string): Promise<BunFile> {
		const file = Bun.file(Server.DOCUMENT_PATH + key);

		if (!(await file.exists())) {
			ErrorHandler.send(ErrorCode.documentNotFound);
		}

		return file;
	}

	private static validateKey(key: string): void {
		if (
			!ValidatorUtils.isValidBase64URL(key) ||
			!ValidatorUtils.isLengthWithinRange(
				Bun.stringWidth(key),
				Server.DOCUMENT_KEY_LENGTH_MIN,
				Server.DOCUMENT_KEY_LENGTH_MAX
			)
		) {
			ErrorHandler.send(ErrorCode.validationInvalid);
		}
	}

	private static validateSecret(secret: string, documentSecret: CompatDocumentStruct['secret']): void {
		if (documentSecret && documentSecret !== secret) {
			ErrorHandler.send(ErrorCode.documentInvalidSecret);
		}
	}

	private static validateSecretLength(secret: string): void {
		if (
			ValidatorUtils.isEmptyString(secret) ||
			!ValidatorUtils.isLengthWithinRange(Bun.stringWidth(secret), 1, 255)
		) {
			ErrorHandler.send(ErrorCode.documentInvalidSecretLength);
		}
	}

	private static async validatePassword(
		password: string | undefined,
		documentPassword: CompatDocumentStruct['password']
	): Promise<void> {
		if (documentPassword) {
			if (!password || !(await Bun.password.verify(password, documentPassword))) {
				ErrorHandler.send(ErrorCode.documentInvalidPassword);
			}
		}
	}

	private static validatePasswordLength(password: string | undefined): void {
		if (
			password &&
			(ValidatorUtils.isEmptyString(password) ||
				!ValidatorUtils.isLengthWithinRange(Bun.stringWidth(password), 1, 255))
		) {
			ErrorHandler.send(ErrorCode.documentInvalidPasswordLength);
		}
	}

	private static validateTimestamp(key: string, timestamp: CompatDocumentStruct['expirationTimestamp']): void {
		if (timestamp && ValidatorUtils.isLengthWithinRange(timestamp, 1, Date.now())) {
			unlink(Server.DOCUMENT_PATH + key);

			ErrorHandler.send(ErrorCode.documentNotFound);
		}
	}

	private static validateSizeBetweenLimits(body: Uint8Array): void {
		if (!ValidatorUtils.isLengthWithinRange(body.length, 1, Server.DOCUMENT_MAXLENGTH)) {
			ErrorHandler.send(ErrorCode.documentInvalidLength);
		}
	}

	private static validateSelectedKey(key: string | undefined): void {
		if (
			key &&
			(!ValidatorUtils.isValidBase64URL(key) ||
				!ValidatorUtils.isLengthWithinRange(
					Bun.stringWidth(key),
					Server.DOCUMENT_KEY_LENGTH_MIN,
					Server.DOCUMENT_KEY_LENGTH_MAX
				))
		) {
			ErrorHandler.send(ErrorCode.validationInvalid);
		}
	}

	private static validateSelectedKeyLength(length: number | undefined): void {
		if (
			length &&
			!ValidatorUtils.isLengthWithinRange(length, Server.DOCUMENT_KEY_LENGTH_MIN, Server.DOCUMENT_KEY_LENGTH_MAX)
		) {
			ErrorHandler.send(ErrorCode.documentInvalidKeyLength);
		}
	}
}
