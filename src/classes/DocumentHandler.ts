import { unlink } from 'node:fs/promises';
import type { BunFile } from 'bun';
import { decode, encode } from 'cbor-x';
import type { DocumentV1, Parameters, ResponsesV1, ResponsesV2 } from '../types/DocumentHandler.ts';
import { ErrorCode } from '../types/ErrorHandler.ts';
import { ServerEndpointVersion } from '../types/Server.ts';
import { CryptoUtils } from '../utils/CryptoUtils.ts';
import { StringUtils } from '../utils/StringUtils.ts';
import { ValidatorUtils } from '../utils/ValidatorUtils.ts';
import { ErrorHandler } from './ErrorHandler.ts';
import { Server } from './Server.ts';

type ResponseByVersion<V extends ServerEndpointVersion> = V extends ServerEndpointVersion.V1
	? ResponsesV1
	: ResponsesV2;

export class DocumentHandler {
	public static async accessRaw(params: Parameters['access']) {
		DocumentHandler.validateKey(params.key);

		const file = await DocumentHandler.retrieveDocument(params.key);
		const document = await DocumentHandler.documentRead(file);
		let data = document.data;

		if (document.header.dataHash) {
			DocumentHandler.validatePassword(params.password, document.header.dataHash);

			if (params.password) {
				data = CryptoUtils.decrypt(document.data, params.password);
			}
		}

		data = Bun.inflateSync(data);

		return new Response(data);
	}

	public static async access<EndpointVersion extends ServerEndpointVersion>(
		params: Parameters['access'],
		version: EndpointVersion
	): Promise<ResponseByVersion<EndpointVersion>['access']> {
		DocumentHandler.validateKey(params.key);

		const file = await DocumentHandler.retrieveDocument(params.key);
		const document = await DocumentHandler.documentRead(file);

		let data = document.data;

		if (document.header.dataHash) {
			DocumentHandler.validatePassword(params.password, document.header.dataHash);

			if (params.password) {
				data = CryptoUtils.decrypt(document.data, params.password);
			}
		}

		data = Bun.inflateSync(data);

		switch (version) {
			case ServerEndpointVersion.V1: {
				return {
					key: params.key,
					data: new TextDecoder().decode(data)
				};
			}

			case ServerEndpointVersion.V2: {
				return {
					key: params.key,
					data: new TextDecoder().decode(data),
					url: Server.HOSTNAME.concat('/', params.key),
					// Deprecated, for compatibility reasons will be kept to 0
					expirationTimestamp: 0
				};
			}

			default: {
				throw new Error(`Unsupported version: ${version}`);
			}
		}
	}

	public static async edit(params: Parameters['edit']) {
		DocumentHandler.validateKey(params.key);

		const file = await DocumentHandler.retrieveDocument(params.key);
		const document = await DocumentHandler.documentRead(file);

		DocumentHandler.validateSecret(params.secret, document.header.modHash);
		DocumentHandler.validateSizeBetweenLimits(params.body);

		const bodyPack = Bun.deflateSync(params.body);

		document.data = params.password ? CryptoUtils.encrypt(bodyPack, params.password) : bodyPack;

		return {
			edited: await DocumentHandler.documentWrite(Server.DOCUMENT_PATH + params.key, document)
				.then(() => true)
				.catch(() => false)
		};
	}

	public static exists(params: Parameters['exists']) {
		DocumentHandler.validateKey(params.key);

		return Bun.file(Server.DOCUMENT_PATH + params.key).exists();
	}

	public static async publish<EndpointVersion extends ServerEndpointVersion>(
		params: Parameters['publish'],
		version: EndpointVersion
	): Promise<ResponseByVersion<EndpointVersion>['publish']> {
		DocumentHandler.validateSelectedKey(params.selectedKey);
		DocumentHandler.validateSelectedKeyLength(params.selectedKeyLength);
		DocumentHandler.validatePasswordLength(params.password);

		const secret = params.selectedSecret || StringUtils.createSecret();

		DocumentHandler.validateSecretLength(secret);
		DocumentHandler.validateSizeBetweenLimits(params.body);

		const bodyPack = Bun.deflateSync(params.body);
		const key = params.selectedKey || (await StringUtils.createKey(params.selectedKeyLength));

		if (params.selectedKey && (await StringUtils.keyExists(key))) {
			ErrorHandler.send(ErrorCode.documentKeyAlreadyExists);
		}

		const document: DocumentV1 = {
			data: params.password ? CryptoUtils.encrypt(bodyPack, params.password) : bodyPack,
			header: {
				dataHash: params.password ? CryptoUtils.hash(params.password) : null,
				modHash: CryptoUtils.hash(secret),
				createdAt: Date.now()
			},
			version: 1
		};

		await DocumentHandler.documentWrite(Server.DOCUMENT_PATH + key, document);

		switch (version) {
			case ServerEndpointVersion.V1: {
				return { key, secret };
			}

			case ServerEndpointVersion.V2: {
				return {
					key,
					secret,
					url: Server.HOSTNAME.concat('/', key),
					// Deprecated, for compatibility reasons will be kept to 0
					expirationTimestamp: 0
				};
			}

			default: {
				throw new Error(`Unsupported version: ${version}`);
			}
		}
	}

	public static async remove(params: Parameters['remove']) {
		DocumentHandler.validateKey(params.key);

		const file = await DocumentHandler.retrieveDocument(params.key);
		const document = await DocumentHandler.documentRead(file);

		DocumentHandler.validateSecret(params.secret, document.header.modHash);

		return {
			removed: await unlink(Server.DOCUMENT_PATH + params.key)
				.then(() => true)
				.catch(() => false)
		};
	}

	private static async documentRead(file: BunFile): Promise<DocumentV1> {
		return decode(new Uint8Array(await file.arrayBuffer()));
	}

	private static async documentWrite(filePath: string, document: DocumentV1): Promise<void> {
		await Bun.write(filePath, encode(document));
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

	private static validateSecret(secret: string, documentSecret: DocumentV1['header']['modHash']): void {
		if (!CryptoUtils.compare(secret, documentSecret)) {
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

	private static validatePassword(
		password: string | undefined,
		documentPassword: DocumentV1['header']['dataHash']
	): void {
		if (documentPassword) {
			if (password && !CryptoUtils.compare(password, documentPassword)) {
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

	private static validateSizeBetweenLimits(body: any): void {
		if (!ValidatorUtils.isLengthWithinRange(Buffer.byteLength(body, 'utf8'), 1, Server.DOCUMENT_MAXLENGTH)) {
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
